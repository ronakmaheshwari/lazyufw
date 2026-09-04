import blessed from "blessed";

const DEFAULT_HINT = " ↑↓ Nav | a Add | i Insert | d Delete | u Toggle FW | l Toggle Log | r Refresh | ? Help | q Quit ";
const COPYRIGHT_LINE = "{gray-fg} © Ronak Maheshwari · {underline}https://github.com/ronakmaheshwari/lazyufw{/underline}{/gray-fg}";

export function createHeader(): blessed.Widgets.BoxElement {
    return blessed.box({
        top: 0, left: 0, width: "100%", height: 4,
        border: { type: "line" },
        tags: true,
        align: "center",
        style: { border: { fg: "cyan" } },
        content: "{bold}{cyan-fg}Lazy{/cyan-fg} UFW{/bold}\n{gray-fg}Loading status...{/gray-fg}"
    });
}

export interface HeaderStatus {
    firewallActive: boolean;
    loggingOn: boolean;
    statusUnavailable?: boolean;
}

export function renderHeaderStatus(header: blessed.Widgets.BoxElement, status: HeaderStatus): void {
    const line = status.statusUnavailable
        ? "{red-fg}{bold}STATUS UNAVAILABLE{/bold}{/red-fg}"
        : `ufw: ${status.firewallActive ? "{green-fg}active{/}" : "{red-fg}inactive{/}"}   log: ${status.loggingOn ? "on" : "off"}`;
    header.setContent(`{bold}{cyan-fg}Lazy{/cyan-fg} UFW{/bold}\n${line}`);
}

export function createFooter(): blessed.Widgets.BoxElement {
    const footer = blessed.box({
        bottom: 0, left: 0, width: "100%", height: 3,
        border: { type: "line" },
        tags: true,
        style: { border: { fg: "gray" } }
    });
    footer.setContent(`${DEFAULT_HINT}\n${COPYRIGHT_LINE}`);
    return footer;
}

export function setFooterHint(footer: blessed.Widgets.BoxElement, text: string): void {
  footer.setContent(` ${text} \n${COPYRIGHT_LINE}`);
}

export function resetFooterHint(footer: blessed.Widgets.BoxElement): void {
  footer.setContent(`${DEFAULT_HINT}\n${COPYRIGHT_LINE}`);
}