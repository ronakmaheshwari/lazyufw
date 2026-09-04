import blessed from "blessed";
import { BaseModal } from "./BaseModal";
import type { Modal } from "../../firewall/ufwTypes";
import { theme } from "../theme";

export interface ActionMenuItem {
    key: string;
    label: string;
    description: string;
    action: () => void | Promise<void>;
}

export class ActionMenuModal implements Modal {
    private base: BaseModal;
    private list: blessed.Widgets.ListElement;

    constructor(
        private screen: blessed.Widgets.Screen,
        private items: ActionMenuItem[],
        private onClose: () => void
    ) {
        this.base = new BaseModal(screen, {
            title: "Actions (Lazydocker Menu)",
            width: "55%",
            height: "60%"
        });
        const box = this.base.box;

        const renderedItems = items.map(
            item => `{bold}{cyan-fg}[${item.key}]{/cyan-fg} ${item.label.padEnd(26)}{/bold} {gray-fg}${item.description}{/gray-fg}`
        );

        this.list = blessed.list({
            parent: box,
            top: 1,
            left: 1,
            width: "96%",
            height: "82%",
            keys: true,
            vi: true,
            mouse: true,
            tags: true,
            style: {
                selected: { fg: "black", bg: theme.border.focus, bold: true },
                item: { fg: "white" }
            },
            items: renderedItems
        });

        blessed.box({
            parent: box,
            bottom: 0,
            left: 2,
            width: "90%",
            height: 1,
            content: "{gray-fg}Enter/Key: run action  |  Esc: close menu{/gray-fg}",
            tags: true
        });

        this.base.bindKey(["escape"], () => this.onClose());
        this.list.on("select", (_item, index) => {
            const chosen = this.items[index];
            this.onClose();
            if (chosen) void chosen.action();
        });

        // Allow pressing the individual hotkey to immediately trigger the item!
        for (const item of items) {
            this.base.bindKey([item.key, item.key.toLowerCase(), item.key.toUpperCase()], () => {
                this.onClose();
                void item.action();
            });
        }
    }

    show(): void {
        this.base.show();
    }

    destroy(): void {
        this.base.destroy();
    }

    focus(): void {
        this.list.focus();
        this.screen.render();
    }
}
