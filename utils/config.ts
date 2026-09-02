import { existsSync } from "node:fs";

function resolveUfwPath(): string {
    if (process.env.UFW_PATH) {
        return process.env.UFW_PATH;
    }

    // common install locations across distros (Arch/Omarchy, Debian/Ubuntu, etc.)
    const candidates = ["/usr/sbin/ufw", "/usr/bin/ufw", "/sbin/ufw"];
    const found = candidates.find(existsSync);

    if (!found) {
        throw new Error(
            "Could not locate the ufw binary. Set UFW_PATH env var explicitly."
        );
    }

    return found;
}

export const UFW_PATH = resolveUfwPath();
export const SUDOERS_FILE = "/etc/sudoers.d/lazyufw-nopasswd";
export const SUDO_USER = process.env.SUDO_USER || process.env.USER || "";