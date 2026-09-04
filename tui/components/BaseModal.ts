import blessed from "blessed";

export interface BaseModalOptions {
  title: string;
  width?: number | string;
  height?: number | string;
}

export class BaseModal {
  readonly box: blessed.Widgets.BoxElement;

  constructor(screen: blessed.Widgets.Screen, opts: BaseModalOptions) {
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

  show(): void {
    this.box.show();
    this.box.setFront();
  }

  destroy(): void {
    this.box.destroy();
  }
}