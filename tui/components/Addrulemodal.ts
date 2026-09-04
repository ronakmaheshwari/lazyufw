import blessed from "blessed";
import type { CreateRuleInput, Modal } from "../../firewall/ufwTypes";
import { BaseModal } from "./BaseModal";

const ACTIONS: Array<CreateRuleInput["action"]> = ["allow", "deny", "reject", "limit"];
const PROTOCOLS = ["any", "tcp", "udp"] as const;


export interface AddRuleModalCallbacks {
  onSubmit(input: CreateRuleInput): Promise<void> | void;
  onCancel(): void;
}

export class AddRuleModal implements Modal {
  private base: BaseModal;
  private actionIndex = 0;
  private protocolIndex = 0;
  private portInput: blessed.Widgets.TextboxElement;
  private actionLabel: blessed.Widgets.BoxElement;
  private protocolLabel: blessed.Widgets.BoxElement;
  private errorLine: blessed.Widgets.BoxElement;
  private submitBtn: blessed.Widgets.ButtonElement;
  private focusables: blessed.Widgets.BlessedElement[];
  private focusIndex = 0;

  constructor(
    private screen: blessed.Widgets.Screen,
    private callbacks: AddRuleModalCallbacks
  ) {
    this.base = new BaseModal(screen, { title: "Add Rule", width: "50%", height: 11 });
    const box = this.base.box;

    blessed.box({ parent: box, top: 0, left: 2, width: 10, content: "Action:" });
    this.actionLabel = blessed.box({
      parent: box,
      top: 0,
      left: 12,
      width: 20,
      keys: true,
      content: this.formatChoice(ACTIONS, this.actionIndex),
      style: { fg: "cyan" }
    });

    blessed.box({ parent: box, top: 1, left: 2, width: 10, content: "Port:" });
    this.portInput = blessed.textbox({
      parent: box,
      top: 1,
      left: 12,
      width: "70%-14",
      height: 1,
      keys: true,
      style: { fg: "white", focus: { fg: "black", bg: "white" } }
    });

    blessed.box({ parent: box, top: 2, left: 2, width: 10, content: "Protocol:" });
    this.protocolLabel = blessed.box({
      parent: box,
      top: 2,
      left: 12,
      width: 20,
      keys: true,
      content: this.formatChoice(PROTOCOLS, this.protocolIndex),
      style: { fg: "cyan" }
    });

    this.errorLine = blessed.box({
      parent: box,
      top: 4,
      left: 2,
      width: "90%",
      height: 1,
      content: "",
      tags: true,
      style: { fg: "red" }
    });

    this.submitBtn = blessed.button({
      parent: box,
      top: 6,
      left: 2,
      width: 12,
      height: 1,
      keys: true,
      content: "[ Submit ]",
      align: "center",
      style: { fg: "green", focus: { fg: "black", bg: "green" } }
    });

    blessed.box({
      parent: box,
      top: 6,
      right: 2,
      width: 26,
      height: 1,
      content: "Tab: next  Esc: cancel",
      style: { fg: "gray" }
    });

    this.focusables = [this.actionLabel, this.portInput, this.protocolLabel, this.submitBtn];
    this.bindKeys();
    this.portInput.on("keypress", () => this.clearError());
  }

  private formatChoice<T extends string>(options: readonly T[], index: number): string {
    return options.map((o, i) => (i === index ? `[${o}]` : ` ${o} `)).join(" ");
  }

  private bindKeys(): void {
    for (const widget of this.focusables) {
      widget.key(["escape"], () => {
        if (widget === this.portInput) this.portInput.cancel();
        this.callbacks.onCancel();
      });
    }

    this.actionLabel.key(["tab"], () => this.moveFocus(1));
    this.actionLabel.key(["S-tab"], () => this.moveFocus(-1));
    this.actionLabel.key(["left"], () => this.cycleCurrentSelect(-1));
    this.actionLabel.key(["right"], () => this.cycleCurrentSelect(1));
    this.actionLabel.key(["enter"], () => void this.trySubmit());

    this.protocolLabel.key(["tab"], () => this.moveFocus(1));
    this.protocolLabel.key(["S-tab"], () => this.moveFocus(-1));
    this.protocolLabel.key(["left"], () => this.cycleCurrentSelect(-1));
    this.protocolLabel.key(["right"], () => this.cycleCurrentSelect(1));
    this.protocolLabel.key(["enter"], () => void this.trySubmit());

    this.submitBtn.key(["tab"], () => this.moveFocus(1));
    this.submitBtn.key(["S-tab"], () => this.moveFocus(-1));
    this.submitBtn.key(["enter"], () => void this.trySubmit());
    this.submitBtn.on("press", () => void this.trySubmit());

    // The textbox needs its own reader stopped BEFORE focus moves away,
    // or grabKeys stays true and every widget after it (including this
    // one, on re-focus) stops receiving keys correctly.
    this.portInput.key(["tab"], () => {
      this.portInput.cancel();
      this.moveFocus(1);
    });
    this.portInput.key(["S-tab"], () => {
      this.portInput.cancel();
      this.moveFocus(-1);
    });
    this.portInput.key(["enter"], () => {
      this.portInput.submit();
      void this.trySubmit();
    });

    this.base.bindKey(["escape"], () => this.callbacks.onCancel());
  }

  private cycleCurrentSelect(delta: number): void {
    const current = this.focusables[this.focusIndex];
    if (current === this.actionLabel) {
      this.actionIndex = (this.actionIndex + delta + ACTIONS.length) % ACTIONS.length;
      this.actionLabel.setContent(this.formatChoice(ACTIONS, this.actionIndex));
      this.screen.render();
    } else if (current === this.protocolLabel) {
      this.protocolIndex = (this.protocolIndex + delta + PROTOCOLS.length) % PROTOCOLS.length;
      this.protocolLabel.setContent(this.formatChoice(PROTOCOLS, this.protocolIndex));
      this.screen.render();
    }
  }

  private moveFocus(delta: number): void {
    this.focusIndex = (this.focusIndex + delta + this.focusables.length) % this.focusables.length;
    this.focus();
  }

  private setError(message: string): void {
    this.errorLine.setContent(message ? `{red-fg}✗ ${message}{/red-fg}` : "");
    this.screen.render();
  }

  private clearError(): void {
    if (this.errorLine.getContent()) this.setError("");
  }

  private async trySubmit(): Promise<void> {
    const port = this.portInput.getValue().trim();
    if (!port) {
      this.setError("Port is required.");
      return;
    }
    if (!/^\d{1,5}(:\d{1,5})?$/.test(port)) {
      this.setError("Port must be a number or a range like 8000:8100.");
      return;
    }

    this.setError("");
    const protocol = PROTOCOLS[this.protocolIndex];
    try {
      await this.callbacks.onSubmit({
        action: ACTIONS[this.actionIndex]!,
        port,
        protocol: protocol === "any" ? undefined : protocol
      });
    } catch (err) {
      this.setError(err instanceof Error ? err.message : String(err));
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
    if (current === this.portInput) {
      this.portInput.readInput();
    }
    this.screen.render();
  }
}