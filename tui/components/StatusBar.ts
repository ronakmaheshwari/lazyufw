import blessed from "blessed";
import type { UfwStatus } from "../../firewall/ufwTypes";

const DEFAULT_HINT = " ↑↓ Nav | a Add | i Insert | d Delete | u Toggle FW | l Toggle Log | r Refresh | ? Help | q Quit ";
 

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

export function renderHeaderStatus(header: blessed.Widgets.BoxElement, status: Omit<UfwStatus, "rules">): void {
    const active = status.status === "active";
    const logging = status.logging ? status.logging : "unknown";
    const inc = status.defaultIncoming ?? "?";
    const out = status.defaultOutgoing ?? "?";
    const statusDot = active ? "{green-fg}{blink}●{/blink}{/green-fg} Active" : "{red-fg}●{/red-fg} Inactive";

    header.setContent(
        "{bold}{cyan-fg}Lazy{/cyan-fg} UFW{/bold}\n" +
        `${statusDot}  {gray-fg}|{/}  Logging: {yellow-fg}${logging}{/}  {gray-fg}|{/}  In: {green-fg}${inc.toLocaleUpperCase()}{/}  Out: {green-fg}${out.toLocaleUpperCase()}{/}`
    );
}

export function createFooter(): blessed.Widgets.BoxElement {
    return blessed.box({
        bottom: 0, left: 0, width: "100%", height: 3,
        border: { type: "line" },
        tags: true,
        style: { border: { fg: "gray" } }
    });
}

export function setStatus(footer: blessed.Widgets.BoxElement, message: string): void {
    footer.setContent(
        ` {green-fg}{bold}Tab{/}{/} switch  {green-fg}{bold}↑↓{/} nav  {green-fg}{bold}a{/} add  {green-fg}{bold}d{/} delete  {green-fg}{bold}r{/} refresh  {green-fg}{bold}q{/} quit   {gray-fg}|{/} {green-fg}{bold}?{/} help {gray-fg}|{/} ${message}\n` +
        `{gray-fg} © Ronak Maheshwari · {underline}https://github.com/ronakmaheshwari/lazyufw{/underline}{/gray-fg}`
    );
}

export function setFooterHint(footer: blessed.Widgets.BoxElement, text: string): void {
  footer.setContent(` ${text} `);
}

export function resetFooterHint(footer: blessed.Widgets.BoxElement): void {
  footer.setContent(DEFAULT_HINT);
}