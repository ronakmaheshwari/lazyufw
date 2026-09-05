import blessed from "blessed";
import { BaseModal } from "./BaseModal";
import type { Modal } from "../../firewall/ufwTypes";

const HELP_TEXT = [
  "{bold}{cyan-fg}Navigation & Layout:{/cyan-fg}{/bold}",
  "  1 / 2 / 3 / 4     Jump to Panel (Status / Rules / Raw / Detail)",
  "  Tab / Shift-Tab   Cycle focus forward / backward between panels",
  "  Esc               Restore normal split layout from maximized view",
  "  x                 Open Lazydocker Actions Menu",
  "",
  "{bold}{cyan-fg}Firewall Management Actions:{/cyan-fg}{/bold}",
  "  a                 Add firewall rule (port, protocol, from IP/CIDR, comment)",
  "  P                 Application profiles (browse, inspect, allow/deny apps)",
  "  i                 Insert rule at specific position",
  "  d                 Delete currently selected rule",
  "  e                 Enable UFW firewall (ufw --force enable)",
  "  D                 Disable UFW firewall (with SSH Lockout Protection)",
  "  L                 Set UFW logging level modal (low, medium, high, off)",
  "  l                 Quick toggle UFW logging (on / off)",
  "  /                 Search / filter rules in Rules panel",
  "  o                 Cycle sort mode in Rules panel (id, action, to, from)",
  "  c                 Clear active search filter",
  "  R                 Reset UFW firewall (factory reset rules)",
  "  r                 Refresh firewall status and rules",
  "  s                 Configure passwordless sudo (one-time setup)",
  "",
  "{bold}{cyan-fg}General:{/cyan-fg}{/bold}",
  "  ?                 Toggle this help dialog",
  "  q / Ctrl-C        Quit lazyufw",
  "",
  "{bold}{cyan-fg}Inside Dialogs / Modals:{/cyan-fg}{/bold}",
  "  Tab / Shift-Tab   Switch between fields and buttons",
  "  ← / →             Cycle selection values (allow/deny/protocol)",
  "  Enter             Submit form or trigger focused button",
  "  Esc               Close / Cancel"
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
    this.base.bindKey(["escape", "?", "S-/", "h", "S-h", "q", "enter"], () => this.onClose());
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