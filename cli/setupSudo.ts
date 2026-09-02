import { writeFileSync, chmodSync, existsSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { SUDOERS_FILE, UFW_PATH } from "../utils/config";

export function setupSudo(): void {
    if (process.getuid && process.getuid() !== 0) {
        console.error("This command must be run with sudo: sudo lazyufw setup");
        process.exit(1);
    }

    const targetUser = process.env.SUDO_USER;
    if (!targetUser) {
        console.error(
            "Could not determine the original user (SUDO_USER not set). " +
            "Run this via 'sudo lazyufw setup', not as the root user directly."
        );
        process.exit(1);
    }

    const line = `${targetUser} ALL=(root) NOPASSWD: ${UFW_PATH}\n`;

    writeFileSync(SUDOERS_FILE, line, { mode: 0o440 });
    chmodSync(SUDOERS_FILE, 0o440);

    try {
        execFileSync("visudo", ["-c", "-f", SUDOERS_FILE]);
    } catch {
        if (existsSync(SUDOERS_FILE)) {
            unlinkSync(SUDOERS_FILE);
        }
        console.error("Generated sudoers rule failed validation. No changes made.");
        process.exit(1);
    }

    console.log(`lazyufw: passwordless sudo enabled for '${targetUser}' on ${UFW_PATH}`);
    console.log(`lazyufw: you can now run 'lazyufw' without a sudo password each time`);
}