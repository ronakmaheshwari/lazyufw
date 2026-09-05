import blessed from "blessed";
import { BaseModal } from "./BaseModal";
import type { Modal, RuleAction } from "../../firewall/ufwTypes";

export interface AppProfileData {
    name: string;
    title?: string;
    description?: string;
    ports?: string;
}

export interface AppProfilesModalCallbacks {
    onLoadInfo(appName: string): Promise<AppProfileData> | AppProfileData;
    onApply(appName: string, action: string): Promise<void> | void;
    onCancel(): void;
}

const ACTIONS = ["allow", "deny", "reject", "limit"] as const;

export class AppProfilesModal implements Modal {
    private base: BaseModal;
    private profileList: blessed.Widgets.ListElement;
    private searchInput: blessed.Widgets.TextboxElement;
    private detailBox: blessed.Widgets.BoxElement;
    private actionLabel: blessed.Widgets.BoxElement;
    private applyBtn: blessed.Widgets.ButtonElement;
    private errorLine: blessed.Widgets.BoxElement;
    private focusables: blessed.Widgets.BlessedElement[];
    private focusIndex = 0;
    private actionIndex = 0;
    private allProfiles: string[] = [];
    private filteredProfiles: string[] = [];
    private infoCache = new Map<string, AppProfileData>();

    constructor(
        private screen: blessed.Widgets.Screen,
        profiles: string[],
        private callbacks: AppProfilesModalCallbacks
    ) {
        this.base = new BaseModal(screen, {
            title: "Application Profiles [P]",
            width: "75%",
            height: "75%"
        });
        const box = this.base.box;
        this.allProfiles = [...profiles];
        this.filteredProfiles = [...profiles];

        // Search bar
        blessed.box({ parent: box, top: 0, left: 2, width: 8, height: 1, content: "Search:" });
        this.searchInput = blessed.textbox({
            parent: box,
            top: 0,
            left: 11,
            width: "40%-11",
            height: 1,
            keys: true,
            style: { fg: "white", focus: { fg: "black", bg: "white" } }
        });

        // Profile List (Left Column)
        this.profileList = blessed.list({
            parent: box,
            top: 2,
            left: 2,
            width: "40%",
            height: "100%-7",
            border: { type: "line" },
            keys: true,
            vi: true,
            mouse: true,
            tags: true,
            items: this.filteredProfiles.length > 0 ? this.filteredProfiles : ["{gray-fg}No profiles found{/gray-fg}"],
            style: {
                selected: { fg: "black", bg: "cyan", bold: true },
                border: { fg: "gray" },
                item: { fg: "white" }
            }
        });

        // Detail View (Right Column)
        this.detailBox = blessed.box({
            parent: box,
            top: 0,
            left: "44%",
            width: "54%",
            height: "100%-7",
            border: { type: "line" },
            tags: true,
            style: { border: { fg: "gray" } },
            content: "{gray-fg}Select an application profile to view details...{/gray-fg}"
        });

        // Action selector (allow/deny/reject/limit)
        blessed.box({
            parent: box,
            bottom: 2,
            left: 2,
            width: 8,
            height: 1,
            content: "Action:"
        });

        this.actionLabel = blessed.box({
            parent: box,
            bottom: 2,
            left: 11,
            width: 34,
            height: 1,
            keys: true,
            content: this.formatActions(),
            style: { fg: "cyan" }
        });

        // Apply Button
        this.applyBtn = blessed.button({
            parent: box,
            bottom: 2,
            left: 48,
            width: 14,
            height: 1,
            keys: true,
            content: "[ Apply Rule ]",
            align: "center",
            style: { fg: "green", focus: { fg: "black", bg: "green" } }
        });

        // Error line
        this.errorLine = blessed.box({
            parent: box,
            bottom: 1,
            left: 2,
            width: "90%",
            height: 1,
            tags: true,
            content: "",
            style: { fg: "red" }
        });

        // Footer hint
        blessed.box({
            parent: box,
            bottom: 0,
            left: 2,
            width: "90%",
            height: 1,
            style: { fg: "gray" },
            content: "Tab: switch controls  ↑/↓: select profile  ←/→: change action  Enter: apply  Esc: close"
        });

        this.focusables = [this.searchInput, this.profileList, this.actionLabel, this.applyBtn];
        this.bindEvents();

        if (this.filteredProfiles.length > 0) {
            void this.loadSelectedDetail();
        }
    }

    private formatActions(): string {
        return ACTIONS.map((a, i) => (i === this.actionIndex ? `[${a}]` : ` ${a} `)).join(" ");
    }

    private bindEvents(): void {
        this.base.bindKey(["escape"], () => {
            if (this.searchInput.focused) this.searchInput.cancel();
            this.callbacks.onCancel();
        });

        // Search Input
        this.searchInput.on("keypress", () => {
            setTimeout(() => this.filterList(this.searchInput.getValue()), 10);
        });
        this.searchInput.key(["enter"], () => {
            this.searchInput.cancel();
            this.moveFocus(1);
        });
        this.searchInput.key(["tab"], () => {
            this.searchInput.cancel();
            this.moveFocus(1);
        });
        this.searchInput.key(["S-tab"], () => {
            this.searchInput.cancel();
            this.moveFocus(-1);
        });

        // Profile list navigation
        this.profileList.on("select item", () => void this.loadSelectedDetail());
        this.profileList.key(["tab"], () => this.moveFocus(1));
        this.profileList.key(["S-tab"], () => this.moveFocus(-1));
        this.profileList.key(["enter"], () => void this.tryApply());

        // Action Label
        this.actionLabel.key(["tab"], () => this.moveFocus(1));
        this.actionLabel.key(["S-tab"], () => this.moveFocus(-1));
        this.actionLabel.key(["left"], () => this.cycleAction(-1));
        this.actionLabel.key(["right"], () => this.cycleAction(1));
        this.actionLabel.key(["enter"], () => void this.tryApply());

        // Apply Button
        this.applyBtn.key(["tab"], () => this.moveFocus(1));
        this.applyBtn.key(["S-tab"], () => this.moveFocus(-1));
        this.applyBtn.key(["enter"], () => void this.tryApply());
        this.applyBtn.on("press", () => void this.tryApply());
    }

    private filterList(query: string): void {
        const q = query.trim().toLowerCase();
        if (!q) {
            this.filteredProfiles = [...this.allProfiles];
        } else {
            this.filteredProfiles = this.allProfiles.filter(p => p.toLowerCase().includes(q));
        }

        if (this.filteredProfiles.length === 0) {
            this.profileList.setItems(["{gray-fg}No matching profiles{/gray-fg}"]);
            this.detailBox.setContent("{gray-fg}No profile selected{/gray-fg}");
        } else {
            this.profileList.setItems(this.filteredProfiles);
            this.profileList.select(0);
            void this.loadSelectedDetail();
        }
        this.screen.render();
    }

    private getSelectedProfile(): string | undefined {
        if (this.filteredProfiles.length === 0) return undefined;
        const idx = (this.profileList as unknown as { selected: number }).selected;
        return this.filteredProfiles[idx];
    }

    private async loadSelectedDetail(): Promise<void> {
        const appName = this.getSelectedProfile();
        if (!appName) return;

        let info = this.infoCache.get(appName);
        if (!info) {
            this.detailBox.setContent(`{gray-fg}Loading details for ${appName}...{/gray-fg}`);
            this.screen.render();
            try {
                info = await this.callbacks.onLoadInfo(appName);
                this.infoCache.set(appName, info);
            } catch (err) {
                this.detailBox.setContent(`{red-fg}Failed to load profile: ${err instanceof Error ? err.message : String(err)}{/red-fg}`);
                this.screen.render();
                return;
            }
        }

        const lines = [
            `{bold}{cyan-fg}Profile:{/cyan-fg}     ${info.name}{/bold}`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            info.title ? ` {bold}Title:{/bold}       ${info.title}` : "",
            info.description ? ` {bold}Description:{/bold} ${info.description}` : "",
            ` {bold}Ports:{/bold}       {green-fg}${info.ports || "N/A"}{/green-fg}`,
            "",
            `{bold}CLI Command Equivalent:{/bold}`,
            `  {green-fg}$ sudo ufw ${ACTIONS[this.actionIndex]} "${info.name}"{/green-fg}`
        ].filter(Boolean);

        this.detailBox.setContent(lines.join("\n"));
        this.screen.render();
    }

    private cycleAction(delta: number): void {
        this.actionIndex = (this.actionIndex + delta + ACTIONS.length) % ACTIONS.length;
        this.actionLabel.setContent(this.formatActions());
        void this.loadSelectedDetail();
        this.screen.render();
    }

    private moveFocus(delta: number): void {
        this.focusIndex = (this.focusIndex + delta + this.focusables.length) % this.focusables.length;
        this.focus();
    }

    private async tryApply(): Promise<void> {
        const appName = this.getSelectedProfile();
        if (!appName) {
            this.errorLine.setContent("{red-fg}No application profile selected.{/red-fg}");
            this.screen.render();
            return;
        }

        this.errorLine.setContent("");
        const action = ACTIONS[this.actionIndex]!;
        try {
            await this.callbacks.onApply(appName, action);
        } catch (err) {
            this.errorLine.setContent(`{red-fg}Error: ${err instanceof Error ? err.message : String(err)}{/red-fg}`);
            this.screen.render();
        }
    }

    show(): void {
        this.base.show();
    }

    destroy(): void {
        this.base.destroy();
    }

    focus(): void {
        const current = this.focusables[this.focusIndex]!;
        current.focus();
        if (current === this.searchInput) {
            this.searchInput.readInput();
        }
        this.screen.render();
    }
}
