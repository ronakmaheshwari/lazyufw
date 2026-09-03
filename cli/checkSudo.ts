import { execFileSync } from "node:child_process";
import { UFW_PATH } from "../utils/config";
import { spawnSync } from "node:child_process";

export function ensureSudoCached(): boolean {
    const result = spawnSync("sudo", ["-v"], { stdio: "inherit" });
    return result.status === 0;
}

export function isSudoConfigured(): boolean {
    try {
        execFileSync("sudo", ["-n", UFW_PATH, "status"], { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}