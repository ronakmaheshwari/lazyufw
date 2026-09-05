import blessed from "blessed";
import type { CreateRuleInput, Modal } from "../../firewall/ufwTypes";
import { BaseModal } from "./BaseModal";

const ACTIONS: Array<CreateRuleInput["action"]> = ["allow", "deny", "reject", "limit"];
const PROTOCOLS = ["any", "tcp", "udp"] as const;
const IP_OR_CIDR_RE = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;

export interface AddRuleModalCallbacks {
  onSubmit(input: CreateRuleInput): Promise<void> | void;
  onCancel(): void;
}

export class AddRuleModal implements Modal {
  private base: BaseModal;
  private actionIndex = 0;
  private protocolIndex = 0;
  private actionLabel: blessed.Widgets.BoxElement;
  private portInput: blessed.Widgets.TextboxElement;
  private protocolLabel: blessed.Widgets.BoxElement;
  private fromInput: blessed.Widgets.TextboxElement;
  private commentInput: blessed.Widgets.TextboxElement;
  private errorLine: blessed.Widgets.BoxElement;
  private submitBtn: blessed.Widgets.ButtonElement;
  private focusables: blessed.Widgets.BlessedElement[];
  private focusIndex = 0;

  constructor(
    private screen: blessed.Widgets.Screen,
    private callbacks: AddRuleModalCallbacks
  ) {
    this.base = new BaseModal(screen, { title: "Add Rule", width: "55%", height: 16 });
    const box = this.base.box;

    blessed.box({ parent: box, top: 0, left: 2, width: 14, content: "Action:" });
    this.actionLabel = blessed.box({
      parent: box,
      top: 0,
      left: 16,
      width: 28,
      keys: true,
      content: this.formatChoice(ACTIONS, this.actionIndex),
      style: { fg: "cyan" }
    });

    blessed.box({ parent: box, top: 1, left: 2, width: 14, content: "Port:" });
    this.portInput = blessed.textbox({
      parent: box,
      top: 1,
      left: 16,
      width: "70%-16",
      height: 1,
      keys: true,
      style: { fg: "white", focus: { fg: "black", bg: "white" } }
    });

    blessed.box({ parent: box, top: 2, left: 2, width: 14, content: "Protocol:" });
    this.protocolLabel = blessed.box({
      parent: box,
      top: 2,
      left: 16,
      width: 20,
      keys: true,
      content: this.formatChoice(PROTOCOLS, this.protocolIndex),
      style: { fg: "cyan" }
    });

    blessed.box({ parent: box, top: 3, left: 2, width: 14, content: "From (IP/CIDR):" });
    this.fromInput = blessed.textbox({
      parent: box,
      top: 3,
      left: 16,
      width: "70%-16",
      height: 1,
      keys: true,
      style: { fg: "white", focus: { fg: "black", bg: "white" } }
    });

    blessed.box({ parent: box, top: 4, left: 2, width: 14, content: "Comment:" });
    this.commentInput = blessed.textbox({
      parent: box,
      top: 4,
      left: 16,
      width: "70%-16",
      height: 1,
      keys: true,
      style: { fg: "white", focus: { fg: "black", bg: "white" } }
    });

    this.errorLine = blessed.box({
      parent: box,
      top: 6,
      left: 2,
      width: "90%",
      height: 1,
      content: "",
      tags: true,
      style: { fg: "red" }
    });

    this.submitBtn = blessed.button({
      parent: box,
      top: 8,
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
      top: 8,
      right: 2,
      width: 32,
      height: 1,
      content: "Tab: next  ←/→: choice  Esc: cancel",
      style: { fg: "gray" }
    });

    this.focusables = [
      this.actionLabel,
      this.portInput,
      this.protocolLabel,
      this.fromInput,
      this.commentInput,
      this.submitBtn
    ];
    this.bindKeys();
    this.portInput.on("keypress", () => this.clearError());
    this.fromInput.on("keypress", () => this.clearError());
    this.commentInput.on("keypress", () => this.clearError());
  }

  private formatChoice<T extends string>(options: readonly T[], index: number): string {
    return options.map((o, i) => (i === index ? `[${o}]` : ` ${o} `)).join(" ");
  }

  private bindKeys(): void {
    for (const widget of this.focusables) {
      widget.key(["escape"], () => {
        if (widget === this.portInput) this.portInput.cancel();
        if (widget === this.fromInput) this.fromInput.cancel();
        if (widget === this.commentInput) this.commentInput.cancel();
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

    // Textboxes need their reader stopped before focus moves away
    const wireTextbox = (tb: blessed.Widgets.TextboxElement) => {
      tb.key(["tab"], () => {
        tb.cancel();
        this.moveFocus(1);
      });
      tb.key(["S-tab"], () => {
        tb.cancel();
        this.moveFocus(-1);
      });
      tb.key(["enter"], () => {
        tb.submit();
        void this.trySubmit();
      });
    };

    wireTextbox(this.portInput);
    wireTextbox(this.fromInput);
    wireTextbox(this.commentInput);

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
    const from = this.fromInput.getValue().trim();
    const comment = this.commentInput.getValue().trim();

    if (!port) {
      this.setError("Port is required.");
      return;
    }
    if (!/^\d{1,5}(:\d{1,5})?$/.test(port)) {
      this.setError("Port must be a number or a range like 8000:8100.");
      return;
    }

    if (from && !IP_OR_CIDR_RE.test(from) && from.toLowerCase() !== "any") {
      this.setError("From must be a valid IP/CIDR (e.g. 192.168.1.0/24) or empty.");
      return;
    }

    this.setError("");
    const protocol = PROTOCOLS[this.protocolIndex];
    try {
      await this.callbacks.onSubmit({
        action: ACTIONS[this.actionIndex]!,
        port,
        protocol: protocol === "any" ? undefined : protocol,
        from: from ? from : undefined,
        comment: comment ? comment : undefined
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
    if (
      current === this.portInput ||
      current === this.fromInput ||
      current === this.commentInput
    ) {
      (current as blessed.Widgets.TextboxElement).readInput();
    }
    this.screen.render();
  }
}