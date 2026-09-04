import type blessed from "blessed";

export type PanelId = "rules" | "detail";

export interface PanelHandle {
    id: PanelId;
    widget: blessed.Widgets.BlessedElement;
    baseLabel: string;
}

/**
 * Owns the split/maximize layout math for the two-panel dashboard so
 * dashboard.ts doesn't hand-roll percentage strings for every toggle.
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
        const rules = this.find("rules");
        const detail = this.find("detail");
        const setLabel = (panel: PanelHandle, suffix: string) =>
            (panel.widget as unknown as { setLabel(label: string): void }).setLabel(` ${panel.baseLabel}${suffix} `);

        if (this.maximized === "rules") {
            rules.widget.width = "100%";
            rules.widget.left = 0;
            detail.widget.hide();
            rules.widget.show();
            setLabel(rules, " [max]");
        } else if (this.maximized === "detail") {
            detail.widget.width = "100%";
            detail.widget.left = 0;
            rules.widget.hide();
            detail.widget.show();
            setLabel(detail, " [max]");
        } else {
            rules.widget.width = "70%";
            rules.widget.left = 0;
            detail.widget.width = "30%";
            detail.widget.left = "70%";
            rules.widget.show();
            detail.widget.show();
            setLabel(rules, "");
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
