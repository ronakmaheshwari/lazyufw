import blessed from "blessed";
import type { UfwStatus } from "../../firewall/ufwTypes";
import { theme, focusable } from "../theme";

export class StatusPanel {
    readonly widget: blessed.Widgets.BoxElement;
    private statusData: Partial<UfwStatus> = {};
    private isSudoReady = false;

    constructor() {
        this.widget = blessed.box({
            label: " [1] Status ",
            top: 3,
            left: 0,
            width: "35%",
            height: "28%",
            border: { type: "line" },
            tags: true,
            scrollable: false,
            keys: true,
            mouse: true,
            style: {
                border: { fg: theme.border.idle },
                label: { fg: theme.border.idle }
            },
            content: "{gray-fg}Loading firewall status...{/gray-fg}"
        });

        focusable(
            this.widget,
            color => (this.widget.style.border.fg = color),
            color => ((this.widget.style as any).label.fg = color)
        );
    }

    setStatus(data: Partial<UfwStatus>, sudoReady = false): void {
        this.statusData = data;
        this.isSudoReady = sudoReady;
        this.render();
    }

    render(): void {
        const { status, logging, defaultIncoming, defaultOutgoing, defaultRouted, rules } = this.statusData;

        const isAct = status === "active";
        const statusBadge = isAct
            ? "{green-bg}{black-fg}{bold} ACTIVE {/bold}{/black-fg}{/green-bg}"
            : "{red-bg}{white-fg}{bold} INACTIVE {/bold}{/white-fg}{/red-bg}";

        const logBadge = logging && logging.toLowerCase().includes("on")
            ? `{green-fg}● ON (${logging.replace(/^on\s*/i, "").trim() || "low"}){/green-fg}`
            : "{gray-fg}○ OFF{/gray-fg}";

        const sudoBadge = this.isSudoReady
            ? "{green-fg}Passwordless Sudo{/green-fg}"
            : "{yellow-fg}Standard Sudo{/yellow-fg}";

        const inPolicy = defaultIncoming ? defaultIncoming.toUpperCase() : "DENY";
        const outPolicy = defaultOutgoing ? defaultOutgoing.toUpperCase() : "ALLOW";
        const routedPolicy = defaultRouted ? defaultRouted.toUpperCase() : "DISABLED";

        const inColor = inPolicy === "ALLOW" ? "green" : "red";
        const outColor = outPolicy === "ALLOW" ? "green" : "red";

        const content = [
            ` {bold}State:{/bold}   ${statusBadge}  {gray-fg}|{/gray-fg}  {bold}Log:{/bold} ${logBadge}`,
            ` {bold}Policy:{/bold}  In: {${inColor}-fg}${inPolicy}{/${inColor}-fg} | Out: {${outColor}-fg}${outPolicy}{/${outColor}-fg} | Route: ${routedPolicy}`,
            ` {bold}Rules:{/bold}   ${rules?.length ?? 0} loaded`,
            ` {bold}Auth:{/bold}    ${sudoBadge}`
        ].join("\n");

        this.widget.setContent(content);
    }

    focus(): void {
        this.widget.focus();
    }
}
