export const theme = {
    border: { idle: "gray", focus: "green", accent: "cyan" },
    status: { active: "green", inactive: "red", unknown: "gray" },
    action: {
        ALLOW: "green",
        DENY: "red",
        REJECT: "red",
        LIMIT: "yellow"
    } as Record<string, string>,
    text: { muted: "gray", accent: "cyan", danger: "red", warn: "yellow" }
} as const;

/**
 * Wires the shared idle/focus border-color convention onto a focusable
 * widget. Takes plain setters instead of a widget reference because border
 * and label live under slightly different shapes across blessed widgets.
 */
export function focusable(
    widget: { on(event: "focus" | "blur", handler: () => void): unknown },
    setBorder: (color: string) => void,
    setLabel?: (color: string) => void
): void {
    widget.on("focus", () => {
        setBorder(theme.border.focus);
        setLabel?.(theme.border.focus);
    });
    widget.on("blur", () => {
        setBorder(theme.border.idle);
        setLabel?.(theme.border.idle);
    });
}
