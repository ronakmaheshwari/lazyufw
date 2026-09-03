import blessed from "blessed";
import type { UfwRule } from "../../firewall/ufwTypes";

export function createRuleList(): blessed.Widgets.ListElement {
    const list = blessed.list({
        top: 4,
        left: 0,
        width: "70%",
        height: "100%-8",
        keys: true,
        vi: true,
        mouse: true,
        border: { type: "line" },
        label: " (1) Rules ",
        tags: true,
        style: {
            border: { fg: "gray" },
            selected: { fg: "black", bg: "green" },
            item: { fg: "white" },
            label: { fg: "gray" } as any
        },
        scrollbar: { style: { bg: "cyan" } }
    });

    list.on("focus", () => {
        list.style.border.fg = "green";
        (list as any).style.label.fg = "green";
    });
    list.on("blur", () => {
        list.style.border.fg = "gray";
        (list as any).style.label.fg = "gray";
    });

    return list;
}

const ACTION_COLOR: Record<string, string> = {
    ALLOW: "green",
    DENY: "red",
    REJECT: "red",
    LIMIT: "yellow"
};

export function renderRules(list: blessed.Widgets.ListElement, rules: UfwRule[]): void {
    const header = `{gray-fg}{bold}${"ID".padEnd(4)}${"".padEnd(2)}${"TO".padEnd(24)}${"ACTION".padEnd(9)}FROM{/bold}{/gray-fg}`;
    const rows = rules.map((rule) => {
        const direction = rule.direction === "OUT" ? "→" : "←";
        const color = ACTION_COLOR[rule.action] ?? "white";
        const comment = rule.comment ? `  {gray-fg}# ${rule.comment}{/gray-fg}` : "";
        return (
            `${rule.id.toString().padStart(3)} ${direction} ` +
            `${rule.to.padEnd(22)} ` +
            `{${color}-fg}{bold}${rule.action.padEnd(7)}{/bold}{/${color}-fg} ` +
            `${rule.from}${comment}`
        );
    });
    list.setItems([header, ...rows]);
    if ((list as any).selected === 0 && rows.length > 0) list.select(1);
}