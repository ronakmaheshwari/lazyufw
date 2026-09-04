import blessed from "blessed";
import { BaseModal } from "./BaseModal";
import type { Modal, SshSessionInfo } from "../../firewall/ufwTypes";

export interface SshWarningModalCallbacks {
    onConfirm(): Promise<void> | void;
    onCancel(): void;
}

export class SshWarningModal implements Modal {
    private base: BaseModal;
    private cancelBtn: blessed.Widgets.ButtonElement;
    private confirmBtn: blessed.Widgets.ButtonElement;
    private focusables: blessed.Widgets.ButtonElement[];
    private focusIndex = 0;
    private errorLine: blessed.Widgets.BoxElement;

    constructor(
        private screen: blessed.Widgets.Screen,
        sshInfo: SshSessionInfo,
        private callbacks: SshWarningModalCallbacks
    ) {
        this.base = new BaseModal(screen, {
            title: "⚠️  SSH LOCKOUT PROTECTION WARNING",
            width: "65%",
            height: "55%"
        });
        const box = this.base.box;
        box.style.border.fg = "red";
        (box.style as any).label = { fg: "red", bold: true };

        const message =
            `{bold}{red-fg}⚠️  DANGER: ACTIVE SSH SESSION DETECTED{/red-fg}{/bold}\n\n` +
            `Disabling the firewall may disconnect your session or leave your server\n` +
            `vulnerable to lockouts!\n\n` +
            `{yellow-fg}Connection Info:{/yellow-fg} ${sshInfo.details || "SSH is active on port 22"}\n\n` +
            `{white-fg}Are you sure you want to proceed with disabling UFW?{/white-fg}`;

        blessed.box({
            parent: box,
            top: 1,
            left: 2,
            width: "92%",
            height: 8,
            tags: true,
            content: message
        });

        this.errorLine = blessed.box({
            parent: box,
            top: 9,
            left: 2,
            width: "92%",
            height: 2,
            tags: true,
            content: "",
            style: { fg: "red" }
        });

        // Cancel button is first and default focused to prevent accidental lockout!
        this.cancelBtn = blessed.button({
            parent: box,
            bottom: 1,
            left: 2,
            width: 25,
            height: 1,
            content: "[ Cancel (Keep Safe) ]",
            align: "center",
            style: {
                fg: "green",
                bold: true,
                focus: { fg: "black", bg: "green" }
            }
        });

        this.confirmBtn = blessed.button({
            parent: box,
            bottom: 1,
            left: 30,
            width: 26,
            height: 1,
            content: "[ Force Disable Firewall ]",
            align: "center",
            style: {
                fg: "red",
                bold: true,
                focus: { fg: "white", bg: "red" }
            }
        });

        this.focusables = [this.cancelBtn, this.confirmBtn];
        this.focusIndex = 0; // Default to Cancel!

        this.base.bindKey(["escape"], () => this.callbacks.onCancel());
        this.base.bindKey(["tab", "left", "right"], () => {
            this.focusIndex = 1 - this.focusIndex;
            this.focus();
        });
        this.base.bindKey(["enter"], () => {
            if (this.focusables[this.focusIndex] === this.confirmBtn) {
                void this.tryConfirm();
            } else {
                this.callbacks.onCancel();
            }
        });

        this.cancelBtn.on("press", () => this.callbacks.onCancel());
        this.confirmBtn.on("press", () => void this.tryConfirm());
    }

    private async tryConfirm(): Promise<void> {
        try {
            await this.callbacks.onConfirm();
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
        this.focusables[this.focusIndex]!.focus();
        this.screen.render();
    }
}
