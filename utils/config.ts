import { existsSync } from "node:fs";

export const COMMON_UFW_PATHS = [
    "/usr/sbin/ufw",
    "/usr/bin/ufw",
    "/sbin/ufw",
    "/usr/local/sbin/ufw",
    "/usr/local/bin/ufw"
];

export function findUfwPath(): string | null {
    if (process.env.UFW_PATH && existsSync(process.env.UFW_PATH)) {
        return process.env.UFW_PATH;
    }
    const found = COMMON_UFW_PATHS.find(existsSync);
    return found ?? null;
}

export function isUfwInstalled(): boolean {
    return findUfwPath() !== null;
}

export function getUfwPath(): string {
    if (process.env.UFW_PATH) {
        return process.env.UFW_PATH;
    }
    const detected = findUfwPath();
    if (detected) {
        return detected;
    }
    // Default fallback so module-level imports do not throw prematurely
    return "/usr/sbin/ufw";
}

export const UFW_PATH = getUfwPath();
export const SUDOERS_FILE = "/etc/sudoers.d/lazyufw-nopasswd";
export const SUDO_USER = process.env.SUDO_USER || process.env.USER || "";