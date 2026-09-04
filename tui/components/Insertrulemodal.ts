import blessed from "blessed";
import { BaseModal } from "./BaseModal";
import type { InsertRuleInput, Modal } from "../../firewall/ufwTypes";

export interface InsertRuleModalCallbacks {
  onSubmit(input: InsertRuleInput): Promise<void> | void;
  onCancel(): void;
}

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;

export class InsertRuleModal implements Modal {
  private base: BaseModal;
  private ruleInput: blessed.Widgets.TextboxElement;
  private ipInput: blessed.Widgets.TextboxElement;
  private errorLine: blessed.Widgets.BoxElement;
  private submitBtn: blessed.Widgets.ButtonElement;
  private focusables: blessed.Widgets.BlessedElement[];
  private focusIndex = 0;

  constructor(
    private screen: blessed.Widgets.Screen,
    defaultPosition: number,
    private callbacks: InsertRuleModalCallbacks
  ) {
    this.base = new BaseModal(screen, { title: "Insert Rule (allow from IP)", width: "65%", height: "45%" });
    const box = this.base.box;

    blessed.box({ parent: box, top: 1, left: 2, width: 16, content: "Insert at #:" });
    this.ruleInput = blessed.textbox({
      parent: box,
      top: 1,
      left: 18,
      width: 10,
      height: 1,
      inputOnFocus: true,
      value: String(defaultPosition),
      style: { fg: "white", focus: { fg: "black", bg: "white" } }
    });

    blessed.box({ parent: box, top: 3, left: 2, width: 16, content: "From IP:" });
    this.ipInput = blessed.textbox({
      parent: box,
      top: 3,
      left: 18,
      width: "70%-20",
      height: 1,
      inputOnFocus: true,
      style: { fg: "white", focus: { fg: "black", bg: "white" } }
    });

    this.errorLine = blessed.box({
      parent: box,
      top: 5,
      left: 2,
      width: "90%",
      height: 2,
      content: "",
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

    this.focusables = [this.ruleInput, this.ipInput, this.submitBtn];
    this.bindKeys();
  }

  private bindKeys(): void {
    this.base.bindKey(["escape"], () => this.callbacks.onCancel());
    this.base.bindKey(["tab"], () => this.moveFocus(1));
    this.base.bindKey(["S-tab"], () => this.moveFocus(-1));
    this.ruleInput.key(["enter"], () => this.moveFocus(1));
    this.ipInput.key(["enter"], () => void this.trySubmit());
    this.submitBtn.on("press", () => void this.trySubmit());
    this.base.bindKey(["enter"], () => {
      if (this.focusables[this.focusIndex] === this.submitBtn) void this.trySubmit();
    });
  }

  private moveFocus(delta: number): void {
    this.focusIndex = (this.focusIndex + delta + this.focusables.length) % this.focusables.length;
    this.focus();
  }

  private setError(message: string): void {
    this.errorLine.setContent(message);
    this.screen.render();
  }

  private async trySubmit(): Promise<void> {
    const ruleStr = this.ruleInput.getValue().trim();
    const ipAddr = this.ipInput.getValue().trim();
    const rule = Number(ruleStr);

    if (!Number.isInteger(rule) || rule < 1) {
      this.setError("Position must be a positive integer.");
      return;
    }
    if (!IPV4_RE.test(ipAddr)) {
      this.setError("Enter a valid IPv4 address, e.g. 10.0.0.5 or 10.0.0.0/24.");
      return;
    }

    this.setError("");
    try {
      await this.callbacks.onSubmit({ rule, ipAddr });
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