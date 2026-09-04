import blessed from "blessed";
import type { UfwRule } from "../../firewall/ufwTypes";
import { theme, focusable } from "../theme";
import { truncate } from "../format";

const COLUMN_WIDTH = 24;
const EMPTY_MESSAGE = "{gray-fg}No rules configured. Press 'a' to add one.{/gray-fg}";
const LOADING_MESSAGE = "{gray-fg}Loading rules...{/gray-fg}";

export class RulesPanel {
  readonly widget: blessed.Widgets.ListElement;
  private rules: UfwRule[] = [];
  private state: "loading" | "loaded" = "loading";

  constructor() {
    this.widget = blessed.list({
      label: " (1) Rules ",
      top: 4,
      left: 0,
      width: "70%",
      height: "100%-8",
      keys: true,
      vi: true,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        selected: { fg: "black", bg: theme.border.focus },
        border: { fg: theme.border.idle },
        label: { fg: theme.border.idle } as any
      },
      items: [LOADING_MESSAGE]
    });

    focusable(
      this.widget,
      color => (this.widget.style.border.fg = color),
      color => ((this.widget.style as any).label.fg = color)
    );
  }

  setLoading(): void {
    this.state = "loading";
    this.widget.setItems([LOADING_MESSAGE]);
  }

  setRules(rules: UfwRule[]): void {
    // Keep the cursor on the same rule id across a refresh, instead of
    // leaving it pinned to a numeric index that now points at a different
    // rule after an add/delete shifted everything.
    const currentId = this.state === "loaded" ? this.getSelectedRule()?.id : undefined;

    this.state = "loaded";
    this.rules = rules;

    if (rules.length === 0) {
      this.widget.setItems([EMPTY_MESSAGE]);
      return;
    }

    this.widget.setItems(
      rules.map(rule => {
        const color = theme.action[rule.action] ?? "white";
        const direction = rule.direction === "OUT" ? "→" : "←";
        const to = truncate(rule.to, COLUMN_WIDTH).padEnd(COLUMN_WIDTH);
        const comment = rule.comment ? `  {gray-fg}# ${truncate(rule.comment, 20)}{/gray-fg}` : "";
        return (
          `${String(rule.id).padStart(3)} ${direction} ${to} ` +
          `{${color}-fg}{bold}${rule.action.padEnd(7)}{/bold}{/${color}-fg} ` +
          `${truncate(rule.from, COLUMN_WIDTH)}${comment}`
        );
      })
    );

    const restoredIndex = currentId != null ? rules.findIndex(r => r.id === currentId) : -1;
    this.widget.select(restoredIndex >= 0 ? restoredIndex : 0);
  }

  getSelectedRule(): UfwRule | undefined {
    if (this.rules.length === 0) return undefined;
    const index = (this.widget as unknown as { selected: number }).selected;
    return this.rules[index];
  }

  get isEmpty(): boolean {
    return this.rules.length === 0;
  }

  get count(): number {
    return this.rules.length;
  }

  focus(): void {
    this.widget.focus();
  }
}
