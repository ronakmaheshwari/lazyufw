import type blessed from "blessed";
import type { Modal } from "../../firewall/ufwTypes";

export class FocusManager {
  private stack: Modal[] = [];
  private previouslyFocused: blessed.Widgets.BlessedElement | null = null;

  constructor(private readonly screen: blessed.Widgets.Screen) {}

  get isModalOpen(): boolean {
    return this.stack.length > 0;
  }

  open(modal: Modal): void {
    if (this.stack.length === 0) {
      this.previouslyFocused = this.screen.focused ?? null;
    }
    this.stack.push(modal);
    modal.show();
    modal.focus();
    this.screen.render();
  }

  closeTop(): void {
    const modal = this.stack.pop();
    if (!modal) return;
    modal.destroy();

    const next = this.stack[this.stack.length - 1];
    if (next) {
      next.focus();
    } else if (this.previouslyFocused) {
      this.previouslyFocused.focus();
    }
    this.screen.render();
  }

  closeAll(): void {
    while (this.stack.length) this.closeTop();
  }
}