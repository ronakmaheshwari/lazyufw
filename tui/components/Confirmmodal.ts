import blessed from "blessed";
import { BaseModal } from "./BaseModal";
import type { Modal } from "../../firewall/ufwTypes";

export interface ConfirmModalCallbacks {
  onConfirm(): Promise<void> | void;
  onCancel(): void;
}

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  dangerous?: boolean;
}

export class ConfirmModal implements Modal {
  private base: BaseModal;
  private yesBtn: blessed.Widgets.ButtonElement;
  private noBtn: blessed.Widgets.ButtonElement;
  private focusables: blessed.Widgets.ButtonElement[];
  private focusIndex: number;
  private errorLine: blessed.Widgets.BoxElement;

  constructor(
    private screen: blessed.Widgets.Screen,
    opts: ConfirmModalOptions,
    private callbacks: ConfirmModalCallbacks
  ) {
    this.base = new BaseModal(screen, { title: opts.title, width: "55%", height: "35%" });
    const box = this.base.box;

    blessed.box({ parent: box, top: 1, left: 2, width: "90%", height: 3, content: opts.message });

    this.errorLine = blessed.box({
      parent: box,
      top: 4,
      left: 2,
      width: "90%",
      height: 2,
      content: "",
      style: { fg: "red" }
    });

    this.yesBtn = blessed.button({
      parent: box,
      bottom: 1,
      left: 2,
      width: (opts.confirmLabel?.length ?? 3) + 4,
      height: 1,
      content: `[ ${opts.confirmLabel ?? "Yes"} ]`,
      align: "center",
      style: { fg: "red", focus: { fg: "black", bg: "red" } }
    });

    this.noBtn = blessed.button({
      parent: box,
      bottom: 1,
      left: (opts.confirmLabel?.length ?? 3) + 8,
      width: 10,
      height: 1,
      content: "[ No ]",
      align: "center",
      style: { fg: "white", focus: { fg: "black", bg: "white" } }
    });

    this.focusables = [this.yesBtn, this.noBtn];
    this.focusIndex = opts.dangerous === false ? 0 : 1;

    this.base.bindKey(["escape"], () => this.callbacks.onCancel());
    this.base.bindKey(["tab", "left", "right"], () => {
      this.focusIndex = 1 - this.focusIndex;
      this.focus();
    });
    this.base.bindKey(["enter"], () => {
      if (this.focusables[this.focusIndex] === this.yesBtn) void this.tryConfirm();
      else this.callbacks.onCancel();
    });

    this.yesBtn.on("press", () => void this.tryConfirm());
    this.noBtn.on("press", () => this.callbacks.onCancel());
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