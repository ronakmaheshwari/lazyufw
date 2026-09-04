import { isSudoConfigured } from "./cli/checkSudo";
import { setupSudo } from "./cli/setupSudo";
import { teardownSudo } from "./cli/teardownSudo";
import { startDashboard } from "./tui/dashboard";
import { ufwClient } from "./firewall/ufwClient";
import { isUfwInstalled } from "./utils/config";

const VERSION = "1.0.0";

function printHelp(): void {
    console.log(`
  \x1b[36m\x1b[1mlazyufw\x1b[0m v${VERSION} — The lazier way to manage UFW (Lazydocker style)

  \x1b[1mUSAGE:\x1b[0m
      lazyufw [command] [options]

  \x1b[1mCOMMANDS:\x1b[0m
      (default)       Launch the interactive Lazydocker-style TUI
      setup           Configure passwordless sudoers rule (/etc/sudoers.d/lazyufw-nopasswd)
      teardown        Remove the passwordless sudoers rule
      status          Print verbose firewall status and exit

  \x1b[1mOPTIONS:\x1b[0m
      -h, --help      Display this help guide
      -v, --version   Display lazyufw version

  \x1b[1mKEYBINDINGS (in TUI):\x1b[0m
      1, 2, 3, 4      Jump to Panel (Status, Rules, Raw, Details)
      Tab / Shift-Tab Cycle focus across panels
      x               Open Lazydocker Action Menu
      a                (allow, deny, reject, limit)
      i               Insert rule at specific index
      d               Delete selected rule
      e               Enable UFW firewall
      D               Disable UFW firewall (SSH Lockout Protected)
      l               Toggle logging (on / off)
      R               Reset firewall to factory defaults
      r               Refresh status
      ?               Help Cheatsheet
      q / Ctrl-C      Quit
`);
}

async function printStatus(): Promise<void> {
    const client = new ufwClient();
    try {
        const res = await client.status();
        console.log(res.stdout || res.stderr);
        const rulesRes = await client.numberedRules();
        if (rulesRes.stdout.trim()) {
            console.log("\n" + rulesRes.stdout);
        }
    } catch (err) {
        console.error("Failed to query UFW status:", err instanceof Error ? err.message : err);
        process.exit(1);
    }
}

export async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === "-h" || command === "--help" || command === "help") {
        printHelp();
        return;
    }

    if (command === "-v" || command === "--version" || command === "version") {
        console.log(`lazyufw v${VERSION}`);
        return;
    }

    switch (command) {
        case "setup":
            setupSudo();
            break;
        case "teardown":
            teardownSudo();
            break;
        case "status":
            await printStatus();
            break;
        default:
            if (process.platform !== "linux" && !process.env.UFW_PATH) {
                console.warn("\x1b[33mWarning: lazyufw is designed for Linux with UFW installed.\x1b[0m");
            }
            if (!isUfwInstalled() && process.platform === "linux") {
                console.warn("\x1b[33mWarning: UFW binary not found in standard paths (/usr/sbin/ufw).\x1b[0m");
                console.warn("Set UFW_PATH environment variable if installed elsewhere.\n");
            }

            await startDashboard(new ufwClient());
            break;
    }
}

main().catch(err => {
    console.error("lazyufw encountered an error:", err);
    process.exit(1);
});
