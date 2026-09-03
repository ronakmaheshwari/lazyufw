import blessed from "blessed";
import { UfwClient } from "../firewall/ufwClient";
import { parseRules, parseStatus } from "../firewall/ufwParser";
import type { CreateRuleInput, UfwRule } from "../firewall/ufwTypes";
import { createFooter, createHeader, renderHeaderStatus, setStatus } from "./components/StatusBar";
import { createRuleList, renderRules } from "./components/RuleList";
import { createDetailPanel, renderDetail } from "./components/DetailPanel";
import { showAddModal, showDeleteModal, showHelpModal } from "./components/Modals";
import { ensureSudoCached } from "../cli/checkSudo";

export async function startDashboard(): Promise<void> {
    if (!ensureSudoCached()) {
        console.error("sudo authentication failed or was cancelled.");
        process.exit(1);
    }

    const screen = blessed.screen({ smartCSR: true, title: "Lazy UFW" });
    const client = new UfwClient();

    const header = createHeader();
    const list = createRuleList();
    const detail = createDetailPanel();
    const footer = createFooter();

    let currentRules: UfwRule[] = [];
    let maximized: 0 | 1 | 2 = 0; // 0 = split, 1 = list maxed, 2 = detail maxed

    screen.append(header);
    screen.append(list);
    screen.append(detail);
    screen.append(footer);

    const selectedRule = (): UfwRule | undefined => {
        const idx = (list as any).selected as number;
        return idx > 0 ? currentRules[idx - 1] : undefined; // row 0 is header
    };

    const applyLayout = (): void => {
        if (maximized === 1) {
            list.width = "100%"; list.left = 0;
            detail.hide();
            list.setLabel(" (1) Rules [max] ");
        } else if (maximized === 2) {
            detail.width = "100%"; detail.left = 0;
            list.hide();
            detail.setLabel(" (2) Detail [max] ");
        } else {
            list.width = "70%"; list.left = 0;
            detail.width = "30%"; detail.left = "70%" as any;
            list.show(); detail.show();
            list.setLabel(" (1) Rules ");
            detail.setLabel(" (2) Detail ");
        }
        screen.render();
    };

    const panels = [list, detail];
    let focusIndex = 0;
    const focusPanel = (i: number): void => {
        focusIndex = (i + panels.length) % panels.length;
        panels[focusIndex]!.focus();
        screen.render();
    };

    screen.key(["tab"], () => focusPanel(focusIndex + 1));
    screen.key(["S-tab"], () => focusPanel(focusIndex - 1));
    screen.key(["1"], () => { maximized = maximized === 1 ? 0 : 1; applyLayout(); focusPanel(0); });
    screen.key(["2"], () => { maximized = maximized === 2 ? 0 : 2; applyLayout(); focusPanel(1); });
    screen.key(["escape"], () => { if (maximized !== 0) { maximized = 0; applyLayout(); } });
    screen.key(["?"], () => showHelpModal(screen));

    const refreshHeader = async (): Promise<void> => {
        const result = await client.status();
        renderHeaderStatus(header, result.code === 0 ? parseStatus(result.stdout) : { status: "unknown" });
        screen.render();
    };

    const refresh = async (): Promise<void> => {
        setStatus(footer, "Refreshing...");
        screen.render();

        const result = await client.numberedRules();
        if (result.code !== 0) {
            setStatus(footer, `Error: ${result.stderr.trim() || "ufw failed"}`);
            screen.render();
            return;
        }

        currentRules = parseRules(result.stdout);
        renderRules(list, currentRules);
        renderDetail(detail, selectedRule());
        setStatus(footer, `${currentRules.length} rule(s)`);
        screen.render();
    };

    list.on("select item", () => {
        renderDetail(detail, selectedRule());
        screen.render();
    });

    list.key(["r"], () => void refresh());

    const runAddFlow = (): void => {
        showAddModal(
            screen,
            (input: CreateRuleInput) => {
                setStatus(footer, `Adding ${input.action} ${input.port}/${input.protocol}...`);
                screen.render();
                void client.createRule(input).then((result) => {
                    if (result.code !== 0) {
                        setStatus(footer, `Error: ${result.stderr.trim() || "ufw failed"}`);
                        screen.render();
                        return;
                    }
                    void Promise.all([refresh(), refreshHeader()]);
                });
                focusPanel(focusIndex);
            },
            () => focusPanel(focusIndex)
        );
    };

    const runDeleteFlow = (): void => {
        const preset = selectedRule()?.id;
        showDeleteModal(
            screen,
            preset,
            (ruleId: number) => {
                setStatus(footer, `Deleting rule ${ruleId}...`);
                screen.render();
                void client.deleteRule(String(ruleId)).then((result) => {
                    if (result.code !== 0) {
                        setStatus(footer, `Error: ${result.stderr.trim() || "ufw failed"}`);
                        screen.render();
                        return;
                    }
                    void Promise.all([refresh(), refreshHeader()]);
                });
                focusPanel(focusIndex);
            },
            () => focusPanel(focusIndex)
        );
    };

    screen.key(["a"], runAddFlow);
    screen.key(["d"], runDeleteFlow);

    screen.key(["q", "C-c"], () => process.exit(0));
    screen.on("destroy", () => process.exit(0));

    applyLayout();
    await Promise.all([refreshHeader(), refresh()]);
    focusPanel(0);
}