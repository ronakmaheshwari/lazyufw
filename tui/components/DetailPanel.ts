import blessed from "blessed";
import type { UfwRule } from "../../firewall/ufwTypes";

export function createDetailPanel(): blessed.Widgets.BoxElement {
    const panel = blessed.box({
        top: 4,
        right: 0,
        width: "30%",
        height: "100%-8",
        label: " (2) Detail ",
        border: { type: "line" },
        tags: true,
        keys: true,
        mouse: true,
        style: { border: { fg: "gray" }, label: { fg: "gray" } as any },
        content: "{gray-fg}Select a rule...{/gray-fg}"
    });

    panel.on("focus", () => {
        panel.style.border.fg = "green";
        (panel as any).style.label.fg = "green";
    });
    panel.on("blur", () => {
        panel.style.border.fg = "gray";
        (panel as any).style.label.fg = "gray";
    });

    return panel;
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