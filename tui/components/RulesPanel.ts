import blessed from "blessed";
import type { UfwRule } from "../../firewall/ufwTypes";
import { theme, focusable } from "../theme";
import { truncate } from "../format";

const EMPTY_MESSAGE = "{gray-fg}No rules configured. Press 'a' to add one.{/gray-fg}";
const NO_MATCH_MESSAGE = "{gray-fg}No rules match the current filter. Press 'c' to clear.{/gray-fg}";
const LOADING_MESSAGE = "{gray-fg}Loading rules...{/gray-fg}";

export type SortMode = "id" | "action" | "to" | "from";

export class RulesPanel {
  readonly widget: blessed.Widgets.ListElement;
  private rules: UfwRule[] = [];
  private displayedRules: UfwRule[] = [];
  private state: "loading" | "loaded" = "loading";
  private filterQuery = "";
  private sortMode: SortMode = "id";

  constructor() {
    this.widget = blessed.list({
      label: " [2] Rules ",
      top: "31%",
      left: 0,
      width: "35%",
      height: "44%",
      keys: true,
      vi: true,
      mouse: true,
      tags: true,
      border: { type: "line" },
      style: {
        selected: { fg: "black", bg: theme.border.focus, bold: true },
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

    this.widget.key(["?", "S-/", "h", "S-h", "f1"], () => {
      this.widget.screen.emit("key ?", "?", { full: "?" });
    });
    this.widget.key(["D", "S-d"], () => {
      this.widget.screen.emit("key S-d", "D", { full: "S-d" });
    });

    // Search / filter and sort hotkeys
    this.widget.key(["/"], () => this.openSearchPrompt());
    this.widget.key(["o", "S-s"], () => this.cycleSort());
    this.widget.key(["c"], () => {
      if (this.filterQuery) {
        this.clearFilter();
      }
    });
  }

  setLoading(): void {
    this.state = "loading";
    this.widget.setItems([LOADING_MESSAGE]);
  }

  setRules(rules: UfwRule[]): void {
    this.state = "loaded";
    this.rules = rules;
    this.applyFilterAndSort();
  }

  private applyFilterAndSort(): void {
    const currentId = this.getSelectedRule()?.id;
    let list = [...this.rules];

    if (this.filterQuery) {
      const q = this.filterQuery.toLowerCase();
      list = list.filter(
        r =>
          r.to.toLowerCase().includes(q) ||
          r.from.toLowerCase().includes(q) ||
          r.action.toLowerCase().includes(q) ||
          (r.comment && r.comment.toLowerCase().includes(q)) ||
          String(r.id).includes(q)
      );
    }

    if (this.sortMode === "action") {
      list.sort((a, b) => a.action.localeCompare(b.action) || a.id - b.id);
    } else if (this.sortMode === "to") {
      list.sort((a, b) => a.to.localeCompare(b.to) || a.id - b.id);
    } else if (this.sortMode === "from") {
      list.sort((a, b) => a.from.localeCompare(b.from) || a.id - b.id);
    } else {
      list.sort((a, b) => a.id - b.id);
    }

    this.displayedRules = list;
    this.renderItems();
    this.updateLabel();

    const restoredIndex = currentId != null ? list.findIndex(r => r.id === currentId) : -1;
    this.widget.select(restoredIndex >= 0 ? restoredIndex : 0);
  }

  private renderItems(): void {
    if (this.rules.length === 0) {
      this.widget.setItems([EMPTY_MESSAGE]);
      return;
    }

    if (this.displayedRules.length === 0) {
      this.widget.setItems([NO_MATCH_MESSAGE]);
      return;
    }

    this.widget.setItems(
      this.displayedRules.map(rule => {
        const color = theme.action[rule.action] ?? "white";
        const direction = rule.direction === "OUT" ? "→" : "←";
        const actionBadge = `{${color}-fg}{bold}[${rule.action}]{/bold}{/${color}-fg}`;
        const to = truncate(rule.to, 16).padEnd(16);
        const from = truncate(rule.from, 14);

        return `${String(rule.id).padStart(2)} ${direction} ${to} ${actionBadge} ${from}`;
      })
    );
  }

  private updateLabel(): void {
    let label = " [2] Rules ";
    const badges: string[] = [];
    if (this.sortMode !== "id") {
      badges.push(`sort:${this.sortMode}`);
    }
    if (this.filterQuery) {
      badges.push(`filter:"${this.filterQuery}"`);
    }
    if (badges.length > 0) {
      label = ` [2] Rules (${badges.join(" | ")}) `;
    }
    this.widget.setLabel(label);
  }

  openSearchPrompt(): void {
    const prompt = blessed.prompt({
      parent: this.widget.screen,
      top: "center",
      left: "center",
      width: "50%",
      height: 7,
      border: { type: "line" },
      label: " Filter Rules [/] ",
      style: { border: { fg: "cyan" }, label: { fg: "cyan" } },
      tags: true,
      shadow: true
    });

    prompt.input("Enter filter query (Enter empty to clear):", this.filterQuery, (_err, value) => {
      if (value !== null && value !== undefined) {
        this.filterQuery = value.trim();
        this.applyFilterAndSort();
      }
      prompt.destroy();
      this.widget.screen.render();
      this.widget.focus();
    });
    this.widget.screen.render();
  }

  cycleSort(): void {
    const modes: SortMode[] = ["id", "action", "to", "from"];
    const nextIdx = (modes.indexOf(this.sortMode) + 1) % modes.length;
    this.sortMode = modes[nextIdx]!;
    this.applyFilterAndSort();
    this.widget.screen.render();
  }

  clearFilter(): void {
    this.filterQuery = "";
    this.applyFilterAndSort();
    this.widget.screen.render();
  }

  getSelectedRule(): UfwRule | undefined {
    if (this.displayedRules.length === 0) return undefined;
    const index = (this.widget as unknown as { selected: number }).selected;
    return this.displayedRules[index];
  }

  get isEmpty(): boolean {
    return this.rules.length === 0;
  }

  get count(): number {
    return this.rules.length;
  }

  get filter(): string {
    return this.filterQuery;
  }

  get sort(): SortMode {
    return this.sortMode;
  }

  focus(): void {
    this.widget.focus();
  }
}


