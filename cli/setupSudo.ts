import { writeFileSync, chmodSync, existsSync, unlinkSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { SUDOERS_FILE, getUfwPath } from "../utils/config";

export function setupSudo(): void {
    if (process.platform !== "linux") {
        console.warn("lazyufw: UFW and sudoers configuration are designed for Linux systems.");
    }

    // Auto-escalate with sudo if invoked as regular user
    if (process.getuid && process.getuid() !== 0) {
        console.log("lazyufw: Sudoers configuration requires root. Re-running with sudo...");
        const res = spawnSync("sudo", [process.execPath, ...process.argv.slice(1)], {
            stdio: "inherit"
        });
        if (res.status !== 0) {
            console.error("Sudo authentication cancelled or failed. Run: sudo lazyufw setup");
            process.exit(res.status ?? 1);
        }
        return;
    }

    const targetUser = process.env.SUDO_USER || process.env.USER;
    if (!targetUser || targetUser === "root") {
        console.log("lazyufw: Currently running as root. Passwordless sudo drop-in is not required for root.");
        return;
    }

    const ufwPath = getUfwPath();
    const line = `${targetUser} ALL=(root) NOPASSWD: ${ufwPath}\n`;

    try {
        writeFileSync(SUDOERS_FILE, line, { mode: 0o440 });
        chmodSync(SUDOERS_FILE, 0o440);
    } catch (err) {
        console.error(`Failed to write sudoers file at ${SUDOERS_FILE}:`, err);
        process.exit(1);
    }

    try {
        execFileSync("visudo", ["-c", "-f", SUDOERS_FILE]);
    } catch {
        if (existsSync(SUDOERS_FILE)) {
            unlinkSync(SUDOERS_FILE);
        }
        console.error("Generated sudoers rule failed validation (visudo). No changes were made.");
        process.exit(1);
    }

    console.log(`\n  ✅ lazyufw: passwordless sudo enabled for '${targetUser}' on ${ufwPath}`);
    console.log(`  You can now run 'lazyufw' freely without password prompts!\n`);
}
