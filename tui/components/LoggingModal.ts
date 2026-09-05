import blessed from "blessed";
import { BaseModal } from "./BaseModal";
import type { LogLevel, Modal } from "../../firewall/ufwTypes";

export interface LoggingModalCallbacks {
    onSelect(level: LogLevel): Promise<void> | void;
    onCancel(): void;
}

interface LogOption {
    level: LogLevel;
    label: string;
    description: string;
}

const LOG_OPTIONS: LogOption[] = [
    {
        level: "low",
        label: "Low (Recommended)",
        description: "Logs all blocked packets (not matching default policy) and packets matching logged rules."
    },
    {
        level: "medium",
        label: "Medium",
        description: "Low + logs all allowed packets not matching policy, INVALID packets, and all new connections."
    },
    {
        level: "high",
        label: "High",
        description: "Medium + rate-limiting logs (very verbose; may produce high disk I/O)."
    },
    {
        level: "off",
        label: "Off (Disable Logging)",
        description: "Completely disables UFW firewall packet logging."
    }
];

export class LoggingModal implements Modal {
    private base: BaseModal;
    private list: blessed.Widgets.ListElement;
    private descBox: blessed.Widgets.BoxElement;
    private errorLine: blessed.Widgets.BoxElement;

    constructor(
        private screen: blessed.Widgets.Screen,
        currentLevel: string | undefined,
        private callbacks: LoggingModalCallbacks
    ) {
        this.base = new BaseModal(screen, {
            title: "Set UFW Logging Level [L]",
            width: "55%",
            height: 17
        });
        const box = this.base.box;

        const normCurrent = (currentLevel ?? "").toLowerCase();

        blessed.box({
            parent: box,
            top: 0,
            left: 2,
            width: "90%",
            height: 1,
            tags: true,
            content: `{bold}Select firewall logging level:{/bold}  Current: {yellow-fg}${currentLevel || "off"}{/yellow-fg}`
        });

        const items = LOG_OPTIONS.map((opt, i) => {
            const isCur = normCurrent.includes(opt.level);
            const marker = isCur ? "{green-fg}●{/green-fg} " : "○ ";
            return `${i + 1}. ${marker}${opt.label}`;
        });

        this.list = blessed.list({
            parent: box,
            top: 2,
            left: 2,
            width: "90%",
            height: 5,
            keys: true,
            vi: true,
            mouse: true,
            tags: true,
            items,
            style: {
                selected: { fg: "black", bg: "cyan", bold: true },
                item: { fg: "white" }
            }
        });

        this.descBox = blessed.box({
            parent: box,
            top: 8,
            left: 2,
            width: "90%",
            height: 4,
            border: { type: "line" },
            style: { border: { fg: "gray" } },
            tags: true,
            content: `{gray-fg}${LOG_OPTIONS[0]?.description}{/gray-fg}`
        });

        this.errorLine = blessed.box({
            parent: box,
            top: 12,
            left: 2,
            width: "90%",
            height: 1,
            tags: true,
            content: "",
            style: { fg: "red" }
        });

        blessed.box({
            parent: box,
            top: 14,
            left: 2,
            width: "90%",
            height: 1,
            style: { fg: "gray" },
            content: "↑/↓: select  Enter: apply  Esc: cancel"
        });

        const initialIdx = LOG_OPTIONS.findIndex(o => normCurrent.includes(o.level));
        this.list.select(initialIdx >= 0 ? initialIdx : 0);
        this.updateDescription();

        this.list.on("select item", () => this.updateDescription());

        this.list.key(["enter"], () => void this.trySubmit());
        this.list.on("select", () => void this.trySubmit());

        this.base.bindKey(["escape"], () => this.callbacks.onCancel());
        this.list.key(["1", "2", "3", "4"], (_ch, key) => {
            const idx = Number(key.name) - 1;
            if (idx >= 0 && idx < LOG_OPTIONS.length) {
                this.list.select(idx);
                this.updateDescription();
                void this.trySubmit();
            }
        });
    }

    private updateDescription(): void {
        const idx = (this.list as unknown as { selected: number }).selected;
        const opt = LOG_OPTIONS[idx];
        if (opt) {
            this.descBox.setContent(`{gray-fg}${opt.description}{/gray-fg}`);
            this.screen.render();
        }
    }

    private async trySubmit(): Promise<void> {
        const idx = (this.list as unknown as { selected: number }).selected;
        const opt = LOG_OPTIONS[idx];
        if (!opt) return;

        try {
            await this.callbacks.onSelect(opt.level);
        } catch (err) {
            this.errorLine.setContent(err instanceof Error ? err.message : String(err));
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
        this.list.focus();
        this.screen.render();
    }
}
