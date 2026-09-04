import blessed from "blessed";

const DEFAULT_HINT =
    " {bold}[1-4]{/bold} Panels  {bold}[Tab]{/bold} Next  {bold}[a]{/bold} Add  {bold}[i]{/bold} Insert  {bold}[d]{/bold} Delete  {bold}[e]{/bold} Enable  {bold}[D]{/bold} Disable  {bold}[l]{/bold} Log  {bold}[R]{/bold} Reset  {bold}[x]{/bold} Menu  {bold}[?]{/bold} Help  {bold}[q]{/bold} Quit";

const COPYRIGHT_LINE = "{gray-fg}lazyufw · The lazier way to manage UFW · Press [x] for Actions Menu{/gray-fg}";

export function createHeader(): blessed.Widgets.BoxElement {
    return blessed.box({
        top: 0,
        left: 0,
        width: "100%",
        height: 3,
        border: { type: "line" },
        tags: true,
        style: { border: { fg: "cyan" } },
        content: " {bold}{cyan-fg}lazyufw{/cyan-fg}{/bold}  {gray-fg}│ Loading firewall status...{/gray-fg}"
    });
}

export interface HeaderStatus {
    firewallActive: boolean;
    loggingOn: boolean;
    ruleCount?: number;
    statusUnavailable?: boolean;
}

export function renderHeaderStatus(header: blessed.Widgets.BoxElement, status: HeaderStatus): void {
    if (status.statusUnavailable) {
        header.setContent(
            " {bold}{cyan-fg}lazyufw{/cyan-fg}{/bold}  {gray-fg}│{/gray-fg}  {red-bg}{white-fg}{bold} STATUS UNAVAILABLE {/bold}{/white-fg}{/red-bg}  {gray-fg}(run 'lazyufw setup' or check permissions){/gray-fg}"
        );
        return;
    }

    const fw = status.firewallActive
        ? "{green-bg}{black-fg}{bold} ACTIVE {/bold}{/black-fg}{/green-bg}"
        : "{red-bg}{white-fg}{bold} INACTIVE {/bold}{/white-fg}{/red-bg}";

    const log = status.loggingOn
        ? "{green-fg}log: on{/green-fg}"
        : "{gray-fg}log: off{/gray-fg}";

    const rules = status.ruleCount != null ? `{bold}${status.ruleCount}{/bold} rules` : "";

    header.setContent(
        ` {bold}{cyan-fg}lazyufw{/cyan-fg}{/bold}  {gray-fg}│{/gray-fg}  ufw: ${fw}   ${log}   ${rules ? `{gray-fg}│{/gray-fg}   ${rules}` : ""}`
    );
}

export function createFooter(): blessed.Widgets.BoxElement {
    const footer = blessed.box({
        bottom: 0,
        left: 0,
        width: "100%",
        height: 3,
        border: { type: "line" },
        tags: true,
        style: { border: { fg: "gray" } }
    });
    footer.setContent(`${DEFAULT_HINT}\n ${COPYRIGHT_LINE}`);
    return footer;
}

export function setFooterHint(footer: blessed.Widgets.BoxElement, text: string): void {
    footer.setContent(` ${text}\n ${COPYRIGHT_LINE}`);
}

export function resetFooterHint(footer: blessed.Widgets.BoxElement): void {
    footer.setContent(`${DEFAULT_HINT}\n ${COPYRIGHT_LINE}`);
}