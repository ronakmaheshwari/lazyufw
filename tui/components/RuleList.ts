import blessed from "blessed";
import type { UfwRule } from "../../firewall/ufwTypes";

export function createRuleList(): blessed.Widgets.ListElement {
    return blessed.list({
        top: 3,
        left: 0,
        width: "100%",
        height: "100%-6",
        keys: true,
        vi: true,
        mouse: true,
        border: { type: "line" },
        style: { selected: { fg: "black", bg: "white" } },
        tags: false
    });
}

export function renderRules(list: blessed.Widgets.ListElement, rules: UfwRule[]): void {
    list.setItems(rules.map((rule) => {
        const direction = rule.direction === "OUT" ? "→" : "←";
        const comment = rule.comment ? `  # ${rule.comment}` : "";
        return `${rule.id.toString().padStart(3)} ${direction} ${rule.to.padEnd(22)} ${rule.action.padEnd(7)} ${rule.from}${comment}`;
    }));
}
