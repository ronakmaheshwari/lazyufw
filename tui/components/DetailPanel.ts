import blessed from "blessed";
import type { UfwRule } from "../../firewall/ufwTypes";
import { theme, focusable } from "../theme";

const PLACEHOLDER =
  "{cyan-fg}{bold}Firewall Rule Inspector{/bold}{/cyan-fg}\n\n" +
  "{gray-fg}Select a rule on the left [2] to inspect details, actions, and raw commands.\n\n" +
  "Quick Actions:\n" +
  "  [a] Add Rule        [i] Insert Rule\n" +
  "  [d] Delete Rule     [x] Action Menu\n" +
  "  [e] Enable UFW      [D] Disable UFW (SSH Protected)\n" +
  "  [l] Toggle Log      [R] Reset Firewall\n" +
  "  [r] Refresh         [?] Help Cheatsheet{/gray-fg}";

export class DetailPanel {
  readonly widget: blessed.Widgets.BoxElement;

  constructor() {
    this.widget = blessed.box({
      label: " [4] Inspection / Details ",
      top: 3,
      left: "35%",
      width: "65%",
      height: "100%-6",
      border: { type: "line" },
      tags: true,
      scrollable: true,
      alwaysScroll: false,
      keys: true,
      vi: true,
      mouse: true,
      style: {
        border: { fg: theme.border.idle },
        label: { fg: theme.border.idle }
      },
      content: PLACEHOLDER
    });

    focusable(
      this.widget,
      color => (this.widget.style.border.fg = color),
      color => (this.widget.style.label.fg = color)
    );
  }

  render(rule?: UfwRule): void {
    if (!rule) {
      this.widget.setContent(PLACEHOLDER);
      return;
    }

    const color = theme.action[rule.action] ?? "white";
    const actionBadge = `{${color}-bg}{black-fg}{bold} ${rule.action} {/bold}{/black-fg}{/${color}-bg}`;

    const protocolMatch = /\/(\w+)$/.exec(rule.to);
    const protocol = protocolMatch?.[1] ?? "any";
    const portMatch = /^(\d+(?::\d+)?)/.exec(rule.to);
    const port = portMatch ? portMatch[1] : rule.to;
    const isV6 = rule.to.includes("(v6)") || rule.from.includes("(v6)");

    const cmdEquivalent = `ufw ${rule.action.toLowerCase()} from ${rule.from} to any port ${port}${protocol !== "any" ? ` proto ${protocol}` : ""}`;
    const deleteCmd = `sudo ufw delete ${rule.id}`;

    const lines = [
      `{bold}{cyan-fg}RULE INSPECTION — #${rule.id}{/cyan-fg}{/bold}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ` {bold}Action:{/bold}      ${actionBadge}`,
      ` {bold}Direction:{/bold}   ${rule.direction === "OUT" ? "OUTGOING (OUT →)" : "INCOMING (IN ←)"}`,
      ` {bold}Destination:{/bold} ${rule.to}`,
      ` {bold}Source:{/bold}      ${rule.from}`,
      ` {bold}Protocol:{/bold}    ${protocol.toUpperCase()}`,
      ` {bold}IP Version:{/bold}  ${isV6 ? "IPv6" : "IPv4"}`,
      rule.comment ? ` {bold}Comment:{/bold}     {yellow-fg}${rule.comment}{/yellow-fg}` : "",
      "",
      `{bold}CLI Equivalence:{/bold}`,
      `  {green-fg}$ ${cmdEquivalent}{/green-fg}`,
      `  {gray-fg}$ ${deleteCmd}{/gray-fg}`,
      "",
      `{bold}Keyboard Shortcuts for this rule:{/bold}`,
      `  Press {bold}d{/bold} to delete rule #${rule.id}`,
      `  Press {bold}i{/bold} to insert a new rule before #${rule.id}`,
      `  Press {bold}x{/bold} to open the Lazydocker Action Menu`
    ].filter(Boolean).join("\n");

    this.widget.setContent(lines);
  }

  focus(): void {
    this.widget.focus();
  }
}

