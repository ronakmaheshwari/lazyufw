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
    this.base = new BaseModal(screen, { title: "Add Rule", width: "60%", height: "50%" });
    const box = this.base.box;

    blessed.box({ parent: box, top: 1, left: 2, width: 10, content: "Action:" });
    this.actionLabel = blessed.box({
      parent: box,
      top: 1,
      left: 12,
      width: 20,
      content: this.formatChoice(ACTIONS, this.actionIndex),
      style: { fg: "cyan" }
    });

    blessed.box({ parent: box, top: 3, left: 2, width: 10, content: "Port:" });
    this.portInput = blessed.textbox({
      parent: box,
      top: 3,
      left: 12,
      width: "70%-14",
      height: 1,
      inputOnFocus: true,
      style: { fg: "white", focus: { fg: "black", bg: "white" } }
    });

    blessed.box({ parent: box, top: 5, left: 2, width: 10, content: "Protocol:" });
    this.protocolLabel = blessed.box({
      parent: box,
      top: 5,
      left: 12,
      width: 20,
      content: this.formatChoice(PROTOCOLS, this.protocolIndex),
      style: { fg: "cyan" }
    });

    this.errorLine = blessed.box({
      parent: box,
      top: 7,
      left: 2,
      width: "90%",
      height: 2,
      content: "",
      tags: true,
      style: { fg: "red" }
    });

    this.submitBtn = blessed.button({
      parent: box,
      bottom: 1,
      left: 2,
      width: 12,
      height: 1,
      content: "[ Submit ]",
      align: "center",
      style: { fg: "green", focus: { fg: "black", bg: "green" } }
    });

    blessed.box({
      parent: box,
      bottom: 1,
      right: 2,
      width: 30,
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
    // Focus always sits on a child field, never on `box` itself, so these
    // must be bound at the screen level or they silently never fire.
    this.base.bindKey(["escape"], () => this.callbacks.onCancel());
    this.base.bindKey(["tab"], () => this.moveFocus(1));
    this.base.bindKey(["S-tab"], () => this.moveFocus(-1));
    this.base.bindKey(["left"], () => this.cycleCurrentSelect(-1));
    this.base.bindKey(["right"], () => this.cycleCurrentSelect(1));
    this.base.bindKey(["enter"], () => {
      const current = this.focusables[this.focusIndex];
      if (current === this.submitBtn || current === this.actionLabel || current === this.protocolLabel) {
        void this.trySubmit();
      }
    });

    this.portInput.key(["enter"], () => void this.trySubmit());
    this.submitBtn.on("press", () => void this.trySubmit());
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
    this.focusables[this.focusIndex]!.focus();
    this.screen.render();
  }
}