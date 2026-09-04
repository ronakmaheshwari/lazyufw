import blessed from "blessed";
import { RulesPanel } from "./components/RulesPanel";
import { DetailPanel } from "./components/DetailPanel";
import { StatusPanel } from "./components/StatusPanel";
import { RawPanel } from "./components/RawPanel";
import { FocusManager } from "./components/Focusmanager";
import type { ufwClient } from "../firewall/ufwClient";
import {
    createFooter,
    createHeader,
    renderHeaderStatus,
    resetFooterHint,
    setFooterHint
} from "./components/StatusBar";
import { parseRules, parseStatus } from "../firewall/ufwParser";
import { AddRuleModal } from "./components/Addrulemodal";
import { InsertRuleModal } from "./components/Insertrulemodal";
import { ConfirmModal } from "./components/Confirmmodal";
import { HelpModal } from "./components/Helpmodal";
import { SshWarningModal } from "./components/SshWarningModal";
import { ActionMenuModal, type ActionMenuItem } from "./components/ActionMenuModal";
import { ensureSudoCached, isSudoConfigured } from "../cli/checkSudo";
import { setupSudo } from "../cli/setupSudo";
import { detectActiveSshSession } from "../security/sshProtection";
import { LayoutManager, type PanelId } from "./layout";

export class Dashboard {
    private screen: blessed.Widgets.Screen;
    private header: blessed.Widgets.BoxElement;
    private footer: blessed.Widgets.BoxElement;
    private statusPanel: StatusPanel;
    private rulesPanel: RulesPanel;
    private rawPanel: RawPanel;
    private detailPanel: DetailPanel;
    private layout: LayoutManager;
    private focusManager: FocusManager;
    private focusOrder: PanelId[] = ["status", "rules", "raw", "detail"];
    private focusIndex = 1; // Start on rules panel
    private transientMessage = "";
    private transientTimer: ReturnType<typeof setTimeout> | null = null;
    private firewallActive = false;
    private loggingOn = false;
    private statusUnavailable = false;

    constructor(private client: ufwClient) {
        this.screen = blessed.screen({
            smartCSR: true,
            title: "lazyufw - Lazydocker Style UFW Manager",
            ignoreLocked: ["escape", "tab", "S-tab", "C-c"]
        });

        this.header = createHeader();
        this.footer = createFooter();
        this.statusPanel = new StatusPanel();
        this.rulesPanel = new RulesPanel();
        this.rawPanel = new RawPanel();
        this.detailPanel = new DetailPanel();
        this.focusManager = new FocusManager(this.screen);

        this.layout = new LayoutManager(this.screen, [
            { id: "status", widget: this.statusPanel.widget, baseLabel: "[1] Status" },
            { id: "rules", widget: this.rulesPanel.widget, baseLabel: "[2] Rules" },
            { id: "raw", widget: this.rawPanel.widget, baseLabel: "[3] Raw Output" },
            { id: "detail", widget: this.detailPanel.widget, baseLabel: "[4] Detail" }
        ]);

        this.screen.append(this.header);
        this.screen.append(this.statusPanel.widget);
        this.screen.append(this.rulesPanel.widget);
        this.screen.append(this.rawPanel.widget);
        this.screen.append(this.detailPanel.widget);
        this.screen.append(this.footer);

        this.rulesPanel.widget.on("select item", () => this.renderDetail());

        this.bindGlobalKeys();
        this.layout.apply();
    }

    private bindGlobalKeys(): void {
        const guarded = (handler: () => void | Promise<void>) => () => {
            if (this.focusManager.isModalOpen) return;
            void handler();
        };

        // Navigation
        this.screen.key(["1"], guarded(() => this.toggleMaximize("status")));
        this.screen.key(["2"], guarded(() => this.toggleMaximize("rules")));
        this.screen.key(["3"], guarded(() => this.toggleMaximize("raw")));
        this.screen.key(["4"], guarded(() => this.toggleMaximize("detail")));
        this.screen.key(["tab"], guarded(() => this.cycleFocus(1)));
        this.screen.key(["S-tab"], guarded(() => this.cycleFocus(-1)));
        this.screen.key(["escape"], guarded(() => this.layout.restoreSplit()));

        // UFW Operations
        this.screen.key(["a"], guarded(() => this.openAddModal()));
        this.screen.key(["i"], guarded(() => this.openInsertModal()));
        this.screen.key(["d"], guarded(() => this.openDeleteModal()));
        this.screen.key(["e"], guarded(() => this.enableFirewall()));
        this.screen.key(["D"], guarded(() => this.handleDisableFirewall()));
        this.screen.key(["l"], guarded(() => this.toggleLogging()));
        this.screen.key(["R"], guarded(() => this.openResetModal()));
        this.screen.key(["x"], guarded(() => this.openActionMenu()));
        this.screen.key(["r"], guarded(() => this.refresh()));
        this.screen.key(["s"], guarded(() => this.handleSetupSudo()));
        this.screen.key(["?"], guarded(() => this.openHelpModal()));
        this.screen.key(["q", "C-c"], guarded(() => process.exit(0)));

        this.focusPanel(this.focusIndex);
    }

    private toggleMaximize(id: PanelId): void {
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
        if (id === "status") this.statusPanel.focus();
        else if (id === "rules") this.rulesPanel.focus();
        else if (id === "raw") this.rawPanel.focus();
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

    async refresh(): Promise<void> {
        this.rulesPanel.setLoading();
        this.setTransientMessage("Refreshing firewall status...", 0);
        this.screen.render();

        try {
            const [statusRes, rulesRes, rawRes] = await Promise.all([
                this.client.status(),
                this.client.numberedRules(),
                this.client.rawRules()
            ]);

            if (statusRes.code !== 0) {
                this.statusUnavailable = true;
            } else {
                this.statusUnavailable = false;
                const parsedStatus = parseStatus(statusRes.stdout);
                this.firewallActive = parsedStatus.status === "active";
                this.loggingOn = Boolean(parsedStatus.logging && parsedStatus.logging.toLowerCase().includes("on"));

                const parsedRules = parseRules(rulesRes.stdout);
                this.rulesPanel.setRules(parsedRules);

                this.statusPanel.setStatus({
                    ...parsedStatus,
                    rules: parsedRules
                }, isSudoConfigured());
            }

            this.rawPanel.setContent(rawRes.stdout || statusRes.stdout || "");
            this.renderHeader();
            this.renderDetail();
            this.transientMessage = "";
            this.renderFooterStatus();
        } catch (err) {
            this.statusUnavailable = true;
            this.renderHeader();
            this.setTransientMessage(`Refresh failed: ${err instanceof Error ? err.message : String(err)}`, 4000);
        }
    }

    // --- Actions ---

    private async enableFirewall(): Promise<void> {
        try {
            this.setTransientMessage("Enabling firewall...", 0);
            await this.client.assertOk(this.client.enable());
            await this.refresh();
            this.setTransientMessage("Firewall ENABLED successfully!");
        } catch (err) {
            this.setTransientMessage(`Failed to enable: ${err instanceof Error ? err.message : String(err)}`, 4000);
        }
    }

    /**
     * Disabling the firewall checks SSH session protection!
     * If an active SSH session is detected, SshWarningModal pops up.
     */
    private async handleDisableFirewall(): Promise<void> {
        const sshInfo = await detectActiveSshSession();

        if (sshInfo.isActive) {
            const modal = new SshWarningModal(this.screen, sshInfo, {
                onCancel: () => {
                    resetFooterHint(this.footer);
                    this.focusManager.closeTop();
                    this.setTransientMessage("Firewall disable canceled (SSH protected).");
                },
                onConfirm: async () => {
                    this.focusManager.closeTop();
                    await this.client.assertOk(this.client.disable());
                    await this.refresh();
                    this.setTransientMessage("Firewall DISABLED.");
                }
            });
            setFooterHint(this.footer, "⚠️ Active SSH Session! Tab: choose | Enter: confirm | Esc: cancel");
            this.focusManager.open(modal);
            return;
        }

        // Standard confirmation when SSH is not active
        const modal = new ConfirmModal(
            this.screen,
            {
                title: "Disable Firewall",
                message: "Are you sure you want to disable the UFW firewall?",
                confirmLabel: "Disable",
                dangerous: true
            },
            {
                onCancel: () => {
                    resetFooterHint(this.footer);
                    this.focusManager.closeTop();
                },
                onConfirm: async () => {
                    this.focusManager.closeTop();
                    await this.client.assertOk(this.client.disable());
                    await this.refresh();
                    this.setTransientMessage("Firewall DISABLED.");
                }
            }
        );
        setFooterHint(this.footer, "Tab/←→: choose | Enter: confirm | Esc: cancel");
        this.focusManager.open(modal);
    }

    private async toggleLogging(): Promise<void> {
        try {
            this.setTransientMessage("Toggling logging...", 0);
            if (this.loggingOn) {
                await this.client.assertOk(this.client.disableLog());
                this.setTransientMessage("Logging turned OFF.");
            } else {
                await this.client.assertOk(this.client.enableLog());
                this.setTransientMessage("Logging turned ON.");
            }
            await this.refresh();
        } catch (err) {
            this.setTransientMessage(`Log toggle failed: ${err instanceof Error ? err.message : String(err)}`, 4000);
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
                this.setTransientMessage(`Added rule: ${input.action} ${input.port}${input.protocol ? "/" + input.protocol : ""}`);
            }
        });
        setFooterHint(this.footer, "Tab: next | ←→ option | Enter: submit | Esc: cancel");
        this.focusManager.open(modal);
    }

    private openInsertModal(): void {
        const currentRule = this.rulesPanel.getSelectedRule();
        const nextPosition = currentRule ? currentRule.id : 1;
        const modal = new InsertRuleModal(this.screen, nextPosition, {
            onCancel: () => {
                resetFooterHint(this.footer);
                this.focusManager.closeTop();
            },
            onSubmit: async input => {
                await this.client.assertOk(this.client.insertRule(input.rule, input.ipAddr, input.action || "allow"));
                resetFooterHint(this.footer);
                this.focusManager.closeTop();
                await this.refresh();
                this.setTransientMessage(`Inserted rule #${input.rule}: allow from ${input.ipAddr}`);
            }
        });
        setFooterHint(this.footer, "Tab: next | Enter: submit | Esc: cancel");
        this.focusManager.open(modal);
    }

    private openDeleteModal(): void {
        const rule = this.rulesPanel.getSelectedRule();
        if (!rule) {
            this.setTransientMessage("No rule selected to delete.");
            return;
        }

        const modal = new ConfirmModal(
            this.screen,
            {
                title: "Delete Rule",
                message: `Delete rule #${rule.id}: ${rule.to} [${rule.action}] from ${rule.from}?`,
                confirmLabel: "Delete",
                dangerous: true
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
                    this.setTransientMessage(`Deleted rule #${rule.id}.`);
                }
            }
        );
        setFooterHint(this.footer, "Tab/←→: choose | Enter: confirm | Esc: cancel");
        this.focusManager.open(modal);
    }

    private openResetModal(): void {
        const modal = new ConfirmModal(
            this.screen,
            {
                title: "RESET FIREWALL — CRITICAL",
                message: "WARNING: This will reset UFW to default factory state and DELETE ALL custom rules! Continue?",
                confirmLabel: "RESET ALL",
                dangerous: true
            },
            {
                onCancel: () => {
                    resetFooterHint(this.footer);
                    this.focusManager.closeTop();
                },
                onConfirm: async () => {
                    this.focusManager.closeTop();
                    await this.client.assertOk(this.client.reset());
                    await this.refresh();
                    this.setTransientMessage("Firewall has been reset to defaults.");
                }
            }
        );
        setFooterHint(this.footer, "Tab/←→: choose | Enter: confirm | Esc: cancel");
        this.focusManager.open(modal);
    }

    private handleSetupSudo(): void {
        if (isSudoConfigured()) {
            this.setTransientMessage("Passwordless sudo is already configured!");
            return;
        }

        const modal = new ConfirmModal(
            this.screen,
            {
                title: "Setup Passwordless Sudo",
                message: "Enable passwordless sudo for ufw commands? (Installs /etc/sudoers.d/lazyufw-nopasswd)",
                confirmLabel: "Configure",
                dangerous: false
            },
            {
                onCancel: () => {
                    this.focusManager.closeTop();
                },
                onConfirm: async () => {
                    this.focusManager.closeTop();
                    try {
                        setupSudo();
                        this.setTransientMessage("Passwordless sudo configured!");
                        await this.refresh();
                    } catch (err) {
                        this.setTransientMessage(`Sudo setup: ${err instanceof Error ? err.message : String(err)}`, 4000);
                    }
                }
            }
        );
        this.focusManager.open(modal);
    }

    private openActionMenu(): void {
        const items: ActionMenuItem[] = [
            { key: "a", label: "Add Rule", description: "Create rule (allow/deny/reject/limit)", action: () => this.openAddModal() },
            { key: "i", label: "Insert Rule", description: "Insert rule at specific position", action: () => this.openInsertModal() },
            { key: "d", label: "Delete Rule", description: "Delete selected rule", action: () => this.openDeleteModal() },
            { key: "e", label: "Enable Firewall", description: "Activate UFW protection", action: () => this.enableFirewall() },
            { key: "D", label: "Disable Firewall", description: "Turn off UFW (SSH Protected)", action: () => this.handleDisableFirewall() },
            { key: "l", label: "Toggle Logging", description: `Turn logging ${this.loggingOn ? "OFF" : "ON"}`, action: () => this.toggleLogging() },
            { key: "R", label: "Reset Rules", description: "Reset all rules to factory defaults", action: () => this.openResetModal() },
            { key: "r", label: "Refresh", description: "Reload rules and status", action: () => this.refresh() },
            { key: "s", label: "Sudoless Setup", description: "Configure passwordless sudoers rule", action: () => this.handleSetupSudo() },
            { key: "?", label: "Help Cheatsheet", description: "View all keyboard shortcuts", action: () => this.openHelpModal() },
            { key: "q", label: "Quit", description: "Exit lazyufw", action: () => process.exit(0) }
        ];

        const modal = new ActionMenuModal(this.screen, items, () => {
            resetFooterHint(this.footer);
            this.focusManager.closeTop();
        });
        setFooterHint(this.footer, "↑↓/Key: select action | Enter: execute | Esc: close");
        this.focusManager.open(modal);
    }

    private openHelpModal(): void {
        const modal = new HelpModal(this.screen, () => {
            resetFooterHint(this.footer);
            this.focusManager.closeTop();
        });
        setFooterHint(this.footer, "Esc / ? / Enter: close help");
        this.focusManager.open(modal);
    }

    async start(): Promise<void> {
        await this.refresh();
        this.focusPanel(this.focusIndex);
        this.screen.render();
    }
}

export async function startDashboard(client: ufwClient): Promise<void> {
    // If sudo is not already configured passwordlessly, attempt terminal auth check
    // BEFORE blessed initializes to avoid corrupting curses screen
    if (!isSudoConfigured()) {
        if (!ensureSudoCached()) {
            console.warn("lazyufw: sudo credentials not cached. Continuing; commands may prompt.");
        }
    }

    const dashboard = new Dashboard(client);
    await dashboard.start();
}
