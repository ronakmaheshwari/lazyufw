import blessed from "blessed";
import type { UfwRule } from "../../firewall/ufwTypes";
import { theme, focusable } from "../theme";

const PLACEHOLDER = "{gray-fg}Select a rule...{/gray-fg}";

export class DetailPanel {
  readonly widget: blessed.Widgets.BoxElement;

  constructor() {
    this.widget = blessed.box({
      label: " (2) Detail ",
      top: 4,
      right: 0,
      width: "30%",
      height: "100%-8",
      border: { type: "line" },
      tags: true,
      scrollable: true,
      alwaysScroll: false,
      keys: true,
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
    const protocolMatch = /\/(\w+)$/.exec(rule.to);
    const protocol = protocolMatch ? ` ${protocolMatch[1]}` : "";
    const portMatch = /^(\d+(?::\d+)?)/.exec(rule.to);
    const port = portMatch ? portMatch[1] : rule.to;
    const command = `ufw ${rule.action.toLowerCase()} ${port}${protocol}`;

    this.widget.setContent(
      `{bold}ID{/bold}        ${rule.id}\n` +
      `{bold}Direction{/bold} ${rule.direction}\n` +
      `{bold}Action{/bold}    {${color}-fg}${rule.action}{/}\n` +
      `{bold}To{/bold}        ${rule.to}\n` +
      `{bold}From{/bold}      ${rule.from}` +
      (rule.comment ? `\n{bold}Comment{/bold}   ${rule.comment}` : "") +
      `\n\n{gray-fg}${command}{/gray-fg}`
    );
  }

  focus(): void {
    this.widget.focus();
  }
}
