import blessed from "blessed";

export function createHeader(): blessed.Widgets.BoxElement {
    return blessed.box({
        top: 0, left: 0, width: "100%", height: 3,
        content: " UFW Firewall Manager",
        style: { fg: "white", bold: true }
    });
}

export function createFooter(): blessed.Widgets.BoxElement {
    return blessed.box({
        bottom: 0, left: 0, width: "100%", height: 3,
        content: " ↑↓ Navigate | A Add | D Delete | R Refresh | Q Quit "
    });
}

export function setStatus(footer: blessed.Widgets.BoxElement, message: string): void {
    footer.setContent(` ${message} | R Refresh | Q Quit `);
}
