import blessed from "blessed";
import type { UfwRule } from "../../firewall/ufwTypes";

export class RulesPanel {
  readonly widget: blessed.Widgets.ListElement;
  private rules: UfwRule[] = [];

  constructor() {
    this.widget = blessed.list({
      label: " Rules ",
      top: 3,
      left: 0,
      width: "100%",
      height: "100%-6",
      keys: true,
      vi: true,
      mouse: true,
      border: { type: "line" },
      style: {
        selected: { fg: "black", bg: "white" },
        border: { fg: "white" }
      }
    });
  }

  setRules(rules: UfwRule[]): void {
    // Try to keep the cursor on the same rule id across a refresh,
    // instead of leaving it pinned to a numeric index that now points
    // at a different rule after an add/delete shifted everything.
    const currentId = this.getSelectedRule()?.id;

    this.rules = rules;
    this.widget.setItems(
      rules.map(
        rule =>
          `${String(rule.id).padStart(3)}. ${rule.to.padEnd(20)} ${rule.action.padEnd(8)} ${rule.direction.padEnd(3)} ${rule.from}`
      )
    );

    const restoredIndex = currentId != null ? rules.findIndex(r => r.id === currentId) : -1;
    this.widget.select(restoredIndex >= 0 ? restoredIndex : 0);
  }

  getSelectedRule(): UfwRule | undefined {
    const index = (this.widget as unknown as { selected: number }).selected;
    return this.rules[index];
  }

  get isEmpty(): boolean {
    return this.rules.length === 0;
  }

  focus(): void {
    this.widget.focus();
  }
}