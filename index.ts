// import { runTui } from "../tui"; // your actual TUI entry point

import { isSudoConfigured } from "./cli/checkSudo";
import { setupSudo } from "./cli/setupSudo";
import { teardownSudo } from "./cli/teardownSudo";
import { startDashboard } from "./tui/dashboard";

function printSetupPrompt(): void {
    console.log("");
    console.log("  lazyufw isn't set up for passwordless sudo yet.");
    console.log("  Without it, every action will prompt for your password.");
    console.log("");
    console.log("  Run this once to enable it:");
    console.log("");
    console.log("      sudo lazyufw setup");
    console.log("");
    console.log("  Continuing in password-prompt mode for now...");
    console.log("");
}

export async function main(): Promise<void> {
    const [, , command] = process.argv;

    switch (command) {
        case "setup":
            setupSudo();
            break;
        case "teardown":
            teardownSudo();
            break;
        default:
            if (!isSudoConfigured()) {
                printSetupPrompt();
            }
            await startDashboard();
            break;
    }
}

if (import.meta.main) {
    await main();
}