import type blessed from "blessed";

export type PanelId = "status" | "rules" | "raw" | "detail";

export interface PanelHandle {
    id: PanelId;
    widget: blessed.Widgets.BlessedElement;
    baseLabel: string;
}

interface Geometry {
    top: number;
    left: number;
    width: number;
    height: number;
}

/**
 * Manages the book-style overlapping dashboard layout and switch animations.
 *
 * Left Stack:  [1] Status is overlapped by [2] Rules (default)
 * Right Stack: [3] Raw Output is overlapped by [4] Detail (default)
 *
 * When focus switches to any panel, a smooth terminal animation slides the
 * selected book forward into prominence while preserving the visible spine
 * of the companion panel.
 */
export class LayoutManager {
    private maximized: PanelId | null = null;
    private leftActive: "status" | "rules" = "rules";
    private rightActive: "raw" | "detail" = "detail";
    private animTimer: ReturnType<typeof setTimeout> | null = null;
    private currentGeometries = new Map<PanelId, Geometry>();

    constructor(
        private screen: blessed.Widgets.Screen,
        private panels: PanelHandle[]
    ) {
        this.screen.on("resize", () => {
            this.apply(false);
        });
    }

    private find(id: PanelId): PanelHandle {
        const panel = this.panels.find(p => p.id === id);
        if (!panel) throw new Error(`Unknown panel: ${id}`);
        return panel;
    }

    private setLabel(panel: PanelHandle, suffix = ""): void {
        (panel.widget as unknown as { setLabel(label: string): void }).setLabel(
            ` ${panel.baseLabel}${suffix} `
        );
    }

    private computeTargets(): Map<PanelId, Geometry> {
        const targets = new Map<PanelId, Geometry>();

        const screenW = Number(this.screen.width) || 80;
        const screenH = Number(this.screen.height) || 24;

        const usableTop = 3;
        const usableH = Math.max(12, screenH - 6);
        const leftW = Math.floor(screenW / 2);
        const rightW = screenW - leftW;

        const spineH = Math.max(3, Math.min(5, Math.floor(usableH / 4)));

        // --- Left Stack: [1] Status & [2] Rules ---
        if (this.leftActive === "rules") {
            // [1] Status is overlapped by [2] Rules (default)
            targets.set("status", {
                top: usableTop,
                left: 0,
                width: leftW,
                height: spineH + 1
            });
            targets.set("rules", {
                top: usableTop + spineH - 1,
                left: 0,
                width: leftW,
                height: usableH - (spineH - 1)
            });
        } else {
            // [1] Status is active and expanded over [2] Rules
            targets.set("status", {
                top: usableTop,
                left: 0,
                width: leftW,
                height: usableH - spineH
            });
            targets.set("rules", {
                top: usableTop + usableH - spineH,
                left: 0,
                width: leftW,
                height: spineH
            });
        }

        // --- Right Stack: [3] Raw Output & [4] Detail ---
        if (this.rightActive === "detail") {
            // [3] Raw Output is overlapped by [4] Detail (default)
            targets.set("raw", {
                top: usableTop,
                left: leftW,
                width: rightW,
                height: spineH + 1
            });
            targets.set("detail", {
                top: usableTop + spineH - 1,
                left: leftW,
                width: rightW,
                height: usableH - (spineH - 1)
            });
        } else {
            // [3] Raw Output is active and expanded over [4] Detail
            targets.set("raw", {
                top: usableTop,
                left: leftW,
                width: rightW,
                height: usableH - spineH
            });
            targets.set("detail", {
                top: usableTop + usableH - spineH,
                left: leftW,
                width: rightW,
                height: spineH
            });
        }

        return targets;
    }

    private applyGeometry(panel: PanelHandle, geom: Geometry): void {
        panel.widget.top = geom.top;
        panel.widget.left = geom.left;
        panel.widget.width = geom.width;
        panel.widget.height = geom.height;
    }

    private orderFront(): void {
        // Bring the active panels of each stack to the front so they overlap the spines
        const status = this.find("status");
        const rules = this.find("rules");
        const raw = this.find("raw");
        const detail = this.find("detail");

        if (this.leftActive === "rules") {
            status.widget.setFront();
            rules.widget.setFront();
        } else {
            rules.widget.setFront();
            status.widget.setFront();
        }

        if (this.rightActive === "detail") {
            raw.widget.setFront();
            detail.widget.setFront();
        } else {
            detail.widget.setFront();
            raw.widget.setFront();
        }
    }

    apply(animate = false): void {
        if (this.animTimer) {
            clearTimeout(this.animTimer);
            this.animTimer = null;
        }

        if (this.maximized) {
            for (const p of this.panels) {
                if (p.id === this.maximized) {
                    p.widget.top = 3;
                    p.widget.left = 0;
                    p.widget.width = "100%";
                    p.widget.height = "100%-6";
                    p.widget.show();
                    p.widget.setFront();
                    this.setLabel(p, " [max]");
                } else {
                    p.widget.hide();
                }
            }
            this.screen.render();
            return;
        }

        // Show all panels if they were hidden by maximize
        for (const p of this.panels) {
            p.widget.show();
            this.setLabel(p, "");
        }

        const targets = this.computeTargets();

        if (!animate || this.currentGeometries.size === 0) {
            for (const p of this.panels) {
                const geom = targets.get(p.id)!;
                this.applyGeometry(p, geom);
                this.currentGeometries.set(p.id, { ...geom });
            }
            this.orderFront();
            this.screen.render();
            return;
        }

        // Animate transition between current and target geometries
        const starts = new Map<PanelId, Geometry>();
        for (const p of this.panels) {
            const cur = this.currentGeometries.get(p.id) ?? targets.get(p.id)!;
            starts.set(p.id, { ...cur });
        }

        // Order z-index before animating so the moving book is visibly in front
        this.orderFront();

        const totalFrames = 7;
        const frameIntervalMs = 15;
        let currentFrame = 0;

        const step = () => {
            currentFrame++;
            const progress = currentFrame / totalFrames;
            // Cubic ease-out
            const ease = 1 - Math.pow(1 - progress, 3);

            for (const p of this.panels) {
                const start = starts.get(p.id)!;
                const target = targets.get(p.id)!;

                const inter: Geometry = {
                    top: Math.round(start.top + (target.top - start.top) * ease),
                    left: Math.round(start.left + (target.left - start.left) * ease),
                    width: Math.round(start.width + (target.width - start.width) * ease),
                    height: Math.round(start.height + (target.height - start.height) * ease)
                };

                this.applyGeometry(p, inter);
                this.currentGeometries.set(p.id, inter);
            }

            this.screen.render();

            if (currentFrame < totalFrames) {
                this.animTimer = setTimeout(step, frameIntervalMs);
            } else {
                // Ensure exact final coordinates
                for (const p of this.panels) {
                    const finalGeom = targets.get(p.id)!;
                    this.applyGeometry(p, finalGeom);
                    this.currentGeometries.set(p.id, { ...finalGeom });
                }
                this.orderFront();
                this.screen.render();
                this.animTimer = null;
            }
        };

        this.animTimer = setTimeout(step, frameIntervalMs);
    }

    /**
     * Activates a panel and smoothly animates its stack to bring the book forward.
     */
    activatePanel(id: PanelId, animate = true): void {
        let changed = false;

        if (id === "status" && this.leftActive !== "status") {
            this.leftActive = "status";
            changed = true;
        } else if (id === "rules" && this.leftActive !== "rules") {
            this.leftActive = "rules";
            changed = true;
        } else if (id === "raw" && this.rightActive !== "raw") {
            this.rightActive = "raw";
            changed = true;
        } else if (id === "detail" && this.rightActive !== "detail") {
            this.rightActive = "detail";
            changed = true;
        }

        if (this.maximized !== null) {
            // If already maximized to a different panel, switch maximization
            this.maximized = id;
            this.apply(false);
            return;
        }

        if (changed || this.currentGeometries.size === 0) {
            this.apply(animate);
        } else {
            this.orderFront();
            this.screen.render();
        }
    }

    toggleMaximize(id: PanelId): void {
        this.maximized = this.maximized === id ? null : id;
        this.apply(false);
    }

    restoreSplit(): void {
        if (this.maximized !== null) {
            this.maximized = null;
            this.apply(false);
        }
    }

    isMaximized(): boolean {
        return this.maximized !== null;
    }
}
