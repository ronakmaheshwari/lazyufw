import blessed from "blessed";
import { theme, focusable } from "../theme";

export class RawPanel {
    readonly widget: blessed.Widgets.BoxElement;

    constructor() {
        this.widget = blessed.box({
            label: " [3] Raw Output ",
            top: 3,
            left: "50%",
            width: "50%",
            height: "50%",
            border: { type: "line" },
            tags: true,
            scrollable: true,
            alwaysScroll: false,
            keys: true,
            vi: true,
            mouse: true,
            style: {
                border: { fg: theme.border.idle },
                label: { fg: theme.border.idle }
            },
            content: "{gray-fg}Loading raw rules...{/gray-fg}"
        });

        focusable(
            this.widget,
            color => (this.widget.style.border.fg = color),
            color => ((this.widget.style as any).label.fg = color)
        );
    }

    setContent(text: string): void {
        this.widget.setContent(text ? `{white-fg}${text.trim()}{/white-fg}` : "{gray-fg}No raw output available{/gray-fg}");
    }

    focus(): void {
        this.widget.focus();
    }
}
