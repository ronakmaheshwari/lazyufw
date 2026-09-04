/** Truncates to `max` chars, adding an ellipsis so no rendered row can overflow a panel's width. */
export function truncate(str: string, max: number): string {
    if (str.length <= max) return str;
    return str.slice(0, Math.max(0, max - 3)) + "...";
}
