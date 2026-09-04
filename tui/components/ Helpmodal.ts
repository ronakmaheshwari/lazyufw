import blessed from "blessed";
import { BaseModal } from "./BaseModal";
import type { Modal } from "../../firewall/ufwTypes";

const HELP_TEXT = [
  "↑ / ↓        Navigate rules",
  "a            Add rule (allow/deny by port)",
  "i            Insert rule at position (allow from IP)",
  "d            Delete selected rule",
  "u            Toggle firewall enable/disable",
  "l            Toggle logging on/off",
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
    this.base.box.key(["escape", "?", "q", "enter"], () => this.onClose());
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