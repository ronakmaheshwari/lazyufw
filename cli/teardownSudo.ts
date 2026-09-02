import { existsSync, unlinkSync } from "node:fs";
import { SUDOERS_FILE } from "../utils/config";

export function teardownSudo(): void {
    if (process.getuid && process.getuid() !== 0) {
        console.error("This command must be run with sudo: sudo lazyufw teardown");
        process.exit(1);
    }

    if (existsSync(SUDOERS_FILE)) {
        unlinkSync(SUDOERS_FILE);
        console.log(`lazyufw: removed ${SUDOERS_FILE}`);
    } else {
        console.log("lazyufw: no sudoers rule found, nothing to remove");
    }
}