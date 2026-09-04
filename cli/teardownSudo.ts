import { existsSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { SUDOERS_FILE } from "../utils/config";

export function teardownSudo(): void {
    if (process.getuid && process.getuid() !== 0) {
        console.log("lazyufw: Removing sudoers file requires root. Re-running with sudo...");
        const res = spawnSync("sudo", [process.execPath, ...process.argv.slice(1)], {
            stdio: "inherit"
        });
        if (res.status !== 0) {
            console.error("Authentication failed. Run manually: sudo lazyufw teardown");
            process.exit(res.status ?? 1);
        }
        return;
    }

    if (existsSync(SUDOERS_FILE)) {
        try {
            unlinkSync(SUDOERS_FILE);
            console.log(`\n  ✅ lazyufw: removed sudoers rule from ${SUDOERS_FILE}\n`);
        } catch (err) {
            console.error(`Failed to remove ${SUDOERS_FILE}:`, err);
            process.exit(1);
        }
    } else {
        console.log("\n  lazyufw: no sudoers rule found, nothing to remove.\n");
    }
}
