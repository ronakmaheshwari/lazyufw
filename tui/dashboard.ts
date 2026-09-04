import blessed from "blessed";
import { RulesPanel } from "./components/RulesPanel";
import { DetailPanel } from "./components/DetailPanel";
import { FocusManager } from "./components/Focusmanager";
import type { ufwClient } from "../firewall/ufwClient";
import { createFooter, createHeader, renderHeaderStatus, resetFooterHint, setFooterHint } from "./components/StatusBar";
import { parseRules } from "../firewall/ufwParser";
import { AddRuleModal } from "./components/Addrulemodal";
import { InsertRuleModal } from "./components/Insertrulemodal";
import { ConfirmModal } from "./components/Confirmmodal";
import { HelpModal } from "./components/Helpmodal";
import { ensureSudoCached } from "../cli/checkSudo";
import { LayoutManager, type PanelId } from "./layout";

export class Dashboard {
  private screen: blessed.Widgets.Screen;
  private header: blessed.Widgets.BoxElement;
  private footer: blessed.Widgets.BoxElement;
  private rulesPanel: RulesPanel;
  private detailPanel: DetailPanel;
  private layout: LayoutManager;
  private focusManager: FocusManager;
  private focusOrder: PanelId[] = ["rules", "detail"];
  private focusIndex = 0;
  private transientMessage = "";
  private transientTimer: ReturnType<typeof setTimeout> | null = null;
  private firewallActive = false;
  private loggingOn = false;
  private statusUnavailable = false;

  constructor(private client: ufwClient) {
    this.screen = blessed.screen({
      smartCSR: true,
      title: "UFW TUI",
      // Without this, a focused textbox (Add/Insert modal) grabs every
      // keypress via blessed's grabKeys mode and Escape/Tab never reach
      // any handler until the textbox itself is done reading input.
      ignoreLocked: ["escape", "tab", "S-tab", "C-c"]
    });
    this.header = createHeader();
    this.footer = createFooter();
    this.rulesPanel = new RulesPanel();
    this.detailPanel = new DetailPanel();
    this.focusManager = new FocusManager(this.screen);
    this.layout = new LayoutManager(this.screen, [
      { id: "rules", widget: this.rulesPanel.widget, baseLabel: "(1) Rules" },
      { id: "detail", widget: this.detailPanel.widget, baseLabel: "(2) Detail" }
    ]);

    this.screen.append(this.header);
    this.screen.append(this.rulesPanel.widget);
    this.screen.append(this.detailPanel.widget);
    this.screen.append(this.footer);

    this.rulesPanel.widget.on("select item", () => this.renderDetail());

    this.bindGlobalKeys();
    this.layout.apply();
  }

  private bindGlobalKeys(): void {
    const guarded = (handler: () => void) => () => {
      if (this.focusManager.isModalOpen) return;
      handler();
    };

    this.screen.key(["a"], guarded(() => this.openAddModal()));
    this.screen.key(["i"], guarded(() => this.openInsertModal()));
    this.screen.key(["d"], guarded(() => this.openDeleteModal()));
    this.screen.key(["r"], guarded(() => void this.refresh()));
    this.screen.key(["?"], guarded(() => this.openHelpModal()));
    this.screen.key(["q", "C-c"], guarded(() => process.exit(0)));

    this.screen.key(["1"], guarded(() => this.toggleMaximize("rules")));
    this.screen.key(["2"], guarded(() => this.toggleMaximize("detail")));
    this.screen.key(["tab"], guarded(() => this.cycleFocus(1)));
    this.screen.key(["S-tab"], guarded(() => this.cycleFocus(-1)));
    this.screen.key(["escape"], guarded(() => this.layout.restoreSplit()));

    this.focusPanel(0);
  }

  private toggleMaximize(id: PanelId): void {
    // Maximizing keeps focus on whichever panel triggered it.
    this.focusIndex = this.focusOrder.indexOf(id);
    this.layout.toggleMaximize(id);
    this.focusPanel(this.focusIndex);
  }

  private cycleFocus(delta: number): void {
    this.focusPanel((this.focusIndex + delta + this.focusOrder.length) % this.focusOrder.length);
  }

  private focusPanel(index: number): void {
    this.focusIndex = index;
    const id = this.focusOrder[index];
    if (id === "rules") this.rulesPanel.focus();
    else this.detailPanel.focus();
    this.screen.render();
  }

  private renderDetail(): void {
    this.detailPanel.render(this.rulesPanel.getSelectedRule());
    this.screen.render();
  }

  private setTransientMessage(message: string, ttlMs = 2500): void {
    this.transientMessage = message;
    this.renderFooterStatus();
    if (this.transientTimer) clearTimeout(this.transientTimer);
    if (ttlMs > 0) {
      this.transientTimer = setTimeout(() => {
        this.transientMessage = "";
        this.transientTimer = null;
        this.renderFooterStatus();
      }, ttlMs);
    }
  }

  private renderFooterStatus(): void {
    if (this.focusManager.isModalOpen) return;
    if (this.transientMessage) {
      setFooterHint(this.footer, this.transientMessage);
    } else {
      resetFooterHint(this.footer);
    }
    this.screen.render();
  }

  private renderHeader(): void {
    renderHeaderStatus(this.header, {
      firewallActive: this.firewallActive,
      loggingOn: this.loggingOn,
      ruleCount: this.rulesPanel.count,
      statusUnavailable: this.statusUnavailable
    });
  }

  private async refreshStatus(): Promise<void> {
    const result = await this.client.status();
    if (result.code !== 0) {
      this.statusUnavailable = true;
    } else {
      this.statusUnavailable = false;
      this.firewallActive = /status:\s*active/i.test(result.stdout);
      this.loggingOn = /logging:\s*on/i.test(result.stdout);
    }
  }

  async refresh(): Promise<void> {
    this.rulesPanel.setLoading();
    this.setTransientMessage("Refreshing...", 0);
    this.screen.render();
    try {
      const [rulesResult] = await Promise.all([this.client.numberedRules(), this.refreshStatus()]);
      const parsed = parseRules(rulesResult.stdout);
      this.rulesPanel.setRules(parsed);
      this.renderHeader();
      this.renderDetail();
      this.transientMessage = "";
      this.renderFooterStatus();
    } catch (err) {
      this.setTransientMessage(`Refresh failed: ${err instanceof Error ? err.message : String(err)}`, 4000);
    }
  }

  private openAddModal(): void {
    const modal = new AddRuleModal(this.screen, {
      onCancel: () => {
        resetFooterHint(this.footer);
        this.focusManager.closeTop();
      },
      onSubmit: async input => {
        await this.client.assertOk(this.client.createRule(input));
        resetFooterHint(this.footer);
        this.focusManager.closeTop();
        await this.refresh();
        this.setTransientMessage(`Added: ${input.action} ${input.port}${input.protocol ? "/" + input.protocol : ""}`);
      }
    });
    setFooterHint(this.footer, "Tab: next field | ←→ change option | Enter: submit | Esc: cancel");
    this.focusManager.open(modal);
  }

  private openInsertModal(): void {
    const nextPosition = 1;
    const modal = new InsertRuleModal(this.screen, nextPosition, {
      onCancel: () => {
        resetFooterHint(this.footer);
        this.focusManager.closeTop();
      },
      onSubmit: async input => {
        await this.client.assertOk(this.client.insertRule(input.rule, input.ipAddr));
        resetFooterHint(this.footer);
        this.focusManager.closeTop();
        await this.refresh();
        this.setTransientMessage(`Inserted rule ${input.rule}: allow from ${input.ipAddr}`);
      }
    });
    setFooterHint(this.footer, "Tab: next field | Enter: submit | Esc: cancel");
    this.focusManager.open(modal);
  }

  private openDeleteModal(): void {
    const rule = this.rulesPanel.getSelectedRule();
    if (!rule) {
      this.setTransientMessage("No rule selected.");
      return;
    }

    const modal = new ConfirmModal(
      this.screen,
      {
        title: "Delete Rule",
        message: `Delete rule ${rule.id}: ${rule.to} ${rule.action} ${rule.from} ?`,
        confirmLabel: "Delete"
      },
      {
        onCancel: () => {
          resetFooterHint(this.footer);
          this.focusManager.closeTop();
        },
        onConfirm: async () => {
          await this.client.assertOk(this.client.deleteRule(String(rule.id)));
          resetFooterHint(this.footer);
          this.focusManager.closeTop();
          await this.refresh();
          this.setTransientMessage(`Deleted rule ${rule.id}.`);
        }
      }
    );
    setFooterHint(this.footer, "Tab/←→: choose | Enter: confirm | Esc: cancel");
    this.focusManager.open(modal);
  }

  private openHelpModal(): void {
    const modal = new HelpModal(this.screen, () => {
      resetFooterHint(this.footer);
      this.focusManager.closeTop();
    });
    setFooterHint(this.footer, "Esc / ? / Enter: close");
    this.focusManager.open(modal);
  }

  async start(): Promise<void> {
    await this.refresh();
    this.focusPanel(this.focusIndex);
    this.screen.render();
  }
}

export async function startDashboard(client: ufwClient): Promise<void> {
  const dashboard = new Dashboard(client);
  if(!ensureSudoCached()) {
    console.error("sudo authentication failed or was cancelled.");
    process.exit(1);
  }
  await dashboard.start();
}
