import blessed from "blessed";

export interface BaseModalOptions {
  title: string;
  width?: number | string;
  height?: number | string;
}

export class BaseModal {
  readonly box: blessed.Widgets.BoxElement;
  private readonly screenBindings: Array<{ keys: string[]; handler: () => void }> = [];

  constructor(private readonly screen: blessed.Widgets.Screen, opts: BaseModalOptions) {
    this.box = blessed.box({
      parent: screen,
      label: ` ${opts.title} `,
      top: "center",
      left: "center",
      width: opts.width ?? "60%",
      height: opts.height ?? "40%",
      border: { type: "line" },
      style: {
        border: { fg: "yellow" },
        label: { fg: "yellow" }
      },
      shadow: true,
      hidden: true
    });
  }

  /**
   * Modal chrome (Esc/Tab) can't be bound on `this.box` itself: blessed only
   * emits "key <name>" on whichever element currently has focus, and focus
   * always sits on a child field/button, not the box. Bind at the screen
   * level instead and tear the listener down when the modal closes.
   */
  bindKey(keys: string[], handler: () => void): void {
    this.screen.key(keys, handler);
    this.screenBindings.push({ keys, handler });
  }

  show(): void {
    this.box.show();
    this.box.setFront();
  }

  destroy(): void {
    for (const { keys, handler } of this.screenBindings) {
      for (const key of keys) {
        this.screen.removeKey(key, handler);
      }
    }
    this.screenBindings.length = 0;
    this.box.destroy();
  }
}