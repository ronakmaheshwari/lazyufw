import type blessed from "blessed";

export type PanelId = "status" | "rules" | "raw" | "detail";

export interface PanelHandle {
    id: PanelId;
    widget: blessed.Widgets.BlessedElement;
    baseLabel: string;
}

/**
 * Manages the Lazydocker-style 4-panel dashboard layout and full-screen maximization.
 */
export class LayoutManager {
    private maximized: PanelId | null = null;

    constructor(
        private screen: blessed.Widgets.Screen,
        private panels: PanelHandle[]
    ) {}

    private find(id: PanelId): PanelHandle {
        const panel = this.panels.find(p => p.id === id);
        if (!panel) throw new Error(`Unknown panel: ${id}`);
        return panel;
    }

    apply(): void {
        const status = this.find("status");
        const rules = this.find("rules");
        const raw = this.find("raw");
        const detail = this.find("detail");

        const setLabel = (panel: PanelHandle, suffix: string) =>
            (panel.widget as unknown as { setLabel(label: string): void }).setLabel(` ${panel.baseLabel}${suffix} `);

        if (this.maximized) {
            for (const p of this.panels) {
                if (p.id === this.maximized) {
                    p.widget.top = 3;
                    p.widget.left = 0;
                    p.widget.width = "100%";
                    p.widget.height = "100%-6";
                    p.widget.show();
                    setLabel(p, " [max]");
                } else {
                    p.widget.hide();
                }
            }
        } else {
            // Restore default Lazydocker 4-panel split
            status.widget.top = 3;
            status.widget.left = 0;
            status.widget.width = "35%";
            status.widget.height = "28%";
            status.widget.show();
            setLabel(status, "");

            rules.widget.top = "31%";
            rules.widget.left = 0;
            rules.widget.width = "35%";
            rules.widget.height = "44%";
            rules.widget.show();
            setLabel(rules, "");

            raw.widget.top = "75%";
            raw.widget.left = 0;
            raw.widget.width = "35%";
            raw.widget.height = "100%-78";
            raw.widget.show();
            setLabel(raw, "");

            detail.widget.top = 3;
            detail.widget.left = "35%";
            detail.widget.width = "65%";
            detail.widget.height = "100%-6";
            detail.widget.show();
            setLabel(detail, "");
        }
        this.screen.render();
    }

    toggleMaximize(id: PanelId): void {
        this.maximized = this.maximized === id ? null : id;
        this.apply();
    }

    restoreSplit(): void {
        if (this.maximized !== null) {
            this.maximized = null;
            this.apply();
        }
    }

    isMaximized(): boolean {
        return this.maximized !== null;
    }
}
