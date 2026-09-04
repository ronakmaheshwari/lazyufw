import blessed from "blessed";
import { BaseModal } from "./BaseModal";
import type { Modal } from "../../firewall/ufwTypes";

const HELP_TEXT = [
  "↑ / ↓        Navigate rules",
  "Tab / S-Tab  Cycle focus between panels",
  "1 / 2        Maximize Rules / Detail panel",
  "Esc          Restore split view",
  "a            Add rule (allow/deny by port)",
  "i            Insert rule at position (allow from IP)",
  "d            Delete selected rule",
  "r            Refresh",
  "?            Toggle this help",
  "q / Ctrl-C   Quit",
  "",
  "Inside a modal:",
  "Tab / Shift-Tab   Move between fields",
  "← / →             Change a selected option",
  "Enter             Confirm / submit",
  "Esc               Cancel"
].join("\n");

export class HelpModal implements Modal {
  private base: BaseModal;

  constructor(
    private screen: blessed.Widgets.Screen,
    private onClose: () => void
  ) {
    this.base = new BaseModal(screen, { title: "Help", width: "60%", height: "60%" });
    blessed.box({
      parent: this.base.box,
      top: 1,
      left: 2,
      width: "90%",
      height: "80%",
      content: HELP_TEXT
    });
    this.base.bindKey(["escape", "?", "q", "enter"], () => this.onClose());
  }

  show(): void {
    this.base.show();
  }

  destroy(): void {
    this.base.destroy();
  }

  focus(): void {
    this.base.box.focus();
    this.screen.render();
  }
}