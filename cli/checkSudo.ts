import { execFileSync } from "node:child_process";
import { UFW_PATH } from "../utils/config";

export function isSudoConfigured(): boolean {
    try {
        execFileSync("sudo", ["-n", UFW_PATH, "status"], { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}