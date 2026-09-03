import blessed from "blessed";
import type { CreateRuleInput } from "../../firewall/ufwTypes";

function overlayBase(screen: blessed.Widgets.Screen, height: number, label: string) {
    return blessed.box({
        parent: screen,
        top: "center",
        left: "center",
        width: 50,
        height,
        border: { type: "line" },
        label: ` ${label} `,
        tags: true,
        style: { border: { fg: "cyan" }, label: { fg: "cyan" } },
        shadow: true
    });
}

export function showAddModal(
    screen: blessed.Widgets.Screen,
    onSubmit: (input: CreateRuleInput) => void,
    onCancel: () => void
): void {
    const box = overlayBase(screen, 14, "(a) Add Rule");

    const form = blessed.form({
        parent: box,
        top: 1, left: 1, width: "100%-4", height: "100%-2",
        keys: true
    });

    blessed.text({ parent: form, top: 0, left: 0, content: "Port:", tags: true });
    const portInput = blessed.textbox({
        parent: form,
        top: 0, left: 8, width: 10, height: 1,
        inputOnFocus: true,
        style: { fg: "white", bg: "black", focus: { bg: "blue" } }
    });

    blessed.text({ parent: form, top: 2, left: 0, content: "Protocol: (space to toggle)", tags: true });
    const protoSet = blessed.radioset({ parent: form, top: 3, left: 0, width: "100%", height: 1 });
    const protoTcp = blessed.radiobutton({ parent: protoSet, left: 0, content: "tcp", checked: true });
    const protoUdp = blessed.radiobutton({ parent: protoSet, left: 10, content: "udp" });

    blessed.text({ parent: form, top: 5, left: 0, content: "Action: (space to toggle)", tags: true });
    const actionSet = blessed.radioset({ parent: form, top: 6, left: 0, width: "100%", height: 1 });
    const actionAllow = blessed.radiobutton({ parent: actionSet, left: 0, content: "allow", checked: true });
    const actionDeny = blessed.radiobutton({ parent: actionSet, left: 10, content: "deny" });

    const errorText = blessed.text({
        parent: form, top: 8, left: 0, content: "", tags: true, style: { fg: "red" }
    });

    blessed.text({
        parent: form, bottom: 0, left: 0,
        content: "{gray-fg}Enter{/} submit   {gray-fg}Esc{/} cancel",
        tags: true
    });

    const cleanup = (): void => {
        box.destroy();
        screen.render();
        onCancel();
    };

    const submit = (): void => {
        const port = Number(portInput.getValue().trim());
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            errorText.setContent("Invalid port (1-65535)");
            screen.render();
            return;
        }
        box.destroy();
        screen.render();
        onSubmit({
            port,
            protocol: protoTcp.checked ? "tcp" : "udp",
            action: actionAllow.checked ? "allow" : "deny"
        });
    };

    form.key(["escape"], cleanup);
    portInput.key(["enter"], submit);
    form.key(["enter"], submit);

    screen.append(box);
    portInput.focus();
    screen.render();
}

export function showDeleteModal(
    screen: blessed.Widgets.Screen,
    presetId: number | undefined,
    onSubmit: (ruleId: number) => void,
    onCancel: () => void
): void {
    const box = overlayBase(screen, 8, "(d) Delete Rule");

    blessed.text({ parent: box, top: 1, left: 1, content: "Rule number:", tags: true });
    const input = blessed.textbox({
        parent: box,
        top: 1, left: 15, width: 10, height: 1,
        inputOnFocus: true,
        value: presetId ? String(presetId) : "",
        style: { fg: "white", bg: "black", focus: { bg: "blue" } }
    });

    const errorText = blessed.text({
        parent: box, top: 3, left: 1, content: "", tags: true, style: { fg: "red" }
    });

    blessed.text({
        parent: box, bottom: 1, left: 1,
        content: "{red-fg}Enter{/} confirm delete   {gray-fg}Esc{/} cancel",
        tags: true
    });

    const cleanup = (): void => {
        box.destroy();
        screen.render();
        onCancel();
    };

    input.key(["escape"], cleanup);
    input.key(["enter"], () => {
        const id = Number(input.getValue().trim());
        if (!Number.isInteger(id) || id < 1) {
            errorText.setContent("Enter a valid rule number");
            screen.render();
            return;
        }
        box.destroy();
        screen.render();
        onSubmit(id);
    });

    screen.append(box);
    input.readInput();
    screen.render();
}

export function showHelpModal(screen: blessed.Widgets.Screen): void {
    const box = overlayBase(screen, 16, "(?) Keybindings");

    blessed.box({
        parent: box,
        top: 1, left: 1, width: "100%-4", height: "100%-2",
        tags: true,
        content:
            "{bold}{cyan-fg}Navigation{/}{/bold}\n" +
            "  1        maximize Rules panel\n" +
            "  2        maximize Detail panel\n" +
            "  Tab      cycle panels\n" +
            "  ↑ / ↓    move selection\n\n" +
            "{bold}{cyan-fg}Actions{/}{/bold}\n" +
            "  a        add rule\n" +
            "  d        delete selected / by number\n" +
            "  r        refresh\n" +
            "  q        quit\n\n" +
            "{gray-fg}Press any key to close{/}"
    });

    box.key(["escape", "enter", "q", "?"], () => {
        box.destroy();
        screen.render();
    });
    box.focus();
    screen.append(box);
    screen.render();
}