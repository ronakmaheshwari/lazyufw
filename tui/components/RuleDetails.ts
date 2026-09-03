import blessed from "blessed";
import type { UfwRule } from "../../firewall/ufwTypes";

export function createDetailPanel(): blessed.Widgets.BoxElement {
    return blessed.box({
        top: 3,
        right: 0,
        width: "30%",
        height: "100%-6",
        label: " Detail ",
        border: { type: "line" },
        tags: true,
        style: { border: { fg: "gray" }, label: { fg: "gray" } },
        content: "{gray-fg}Select a rule...{/gray-fg}"
    });
}

export function renderDetail(panel: blessed.Widgets.BoxElement, rule?: UfwRule): void {
    if (!rule) {
        panel.setContent("{gray-fg}Select a rule...{/gray-fg}");
        return;
    }
    panel.setContent(
        `{bold}ID{/bold}        ${rule.id}\n` +
        `{bold}Direction{/bold} ${rule.direction}\n` +
        `{bold}Action{/bold}    {${rule.action === "ALLOW" ? "green" : "red"}-fg}${rule.action}{/}\n` +
        `{bold}To{/bold}        ${rule.to}\n` +
        `{bold}From{/bold}      ${rule.from}` +
        (rule.comment ? `\n{bold}Comment{/bold}   ${rule.comment}` : "")
    );
}