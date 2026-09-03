import blessed from "blessed";
import { UfwClient } from "../firewall/ufwClient";
import { parseRules } from "../firewall/ufwParser";
import type { UfwRule } from "../firewall/ufwTypes";
import { createFooter, createHeader, setStatus } from "./components/StatusBar";
import { createRuleList, renderRules } from "./components/RuleList";

export async function startDashboard(): Promise<void> {
    const screen = blessed.screen({ smartCSR: true, title: "UFW TUI" });
    const client = new UfwClient();
    const header = createHeader();
    const list = createRuleList();
    const footer = createFooter();
    let currentRules: UfwRule[] = [];

    screen.append(header);
    screen.append(list);
    screen.append(footer);

    const refresh = async (): Promise<void> => {
        setStatus(footer, "Refreshing...");
        screen.render();
        const result = await client.numberedRules();
        if (result.code !== 0) {
            setStatus(footer, `Error: ${result.stderr.trim() || "ufw failed"}`);
            screen.render();
            return;
        }
        currentRules = parseRules(result.stdout);
        renderRules(list, currentRules);
        setStatus(footer, `${currentRules.length} rule(s)`);
        screen.render();
    };

    list.key(["r"], () => void refresh());
    list.key(["d"], () => {
        const selected = (list as blessed.Widgets.ListElement & { selected: number }).selected;
        const rule = selected >= 0 ? currentRules[selected] : undefined;
        if (!rule) return;
        const result = client.deleteRule(String(rule.id));
        void result.then(() => refresh());
    });
    screen.key(["q", "C-c"], () => process.exit(0));
    screen.on("destroy", () => process.exit(0));
    await refresh();
    list.focus();
}
