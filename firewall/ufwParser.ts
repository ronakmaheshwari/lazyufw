import type { FirewallStatus, RuleAction, RuleDirection, UfwRule, UfwStatus } from "./ufwTypes";

// Handles:
// [ 1] 22/tcp                     ALLOW IN    Anywhere
// [ 2] 80/tcp                     ALLOW       Anywhere
// [ 3] 22/tcp (v6)                ALLOW IN    Anywhere (v6)
// [ 4] 443/tcp                    ALLOW IN    Anywhere            # secure web
// [ 5] 53/udp                     ALLOW OUT   Anywhere
const NUMBERED_RULE =
    /^\[\s*(\d+)\]\s+(.+?)\s+(ALLOW|DENY|REJECT|LIMIT)(?:\s+(IN|OUT))?\s+(.+?)(?:\s+#\s*(.*))?$/i;

export function parseRules(output: string): UfwRule[] {
    const rules: UfwRule[] = [];
    for (const line of output.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("[")) continue;
        const match = NUMBERED_RULE.exec(trimmed);
        if (!match) continue;

        const id = Number(match[1]);
        const to = match[2]!.trim();
        const action = match[3]!.toUpperCase() as RuleAction;
        const direction = (match[4]?.toUpperCase() || "IN") as RuleDirection;
        const from = match[5]!.trim();
        const comment = match[6]?.trim();

        rules.push({
            id,
            to,
            action,
            direction,
            from,
            ...(comment ? { comment } : {}),
            raw: trimmed
        });
    }
    return rules;
}

export function parseStatus(output: string): Omit<UfwStatus, "rules"> {
    const statusLine = /^Status:\s*(active|inactive)/im.exec(output);
    const loggingLine = /^Logging:\s*(.+)$/im.exec(output);
    const defaultLine = /^Default:\s*(.+)$/im.exec(output);

    let defaultIncoming: string | undefined;
    let defaultOutgoing: string | undefined;
    let defaultRouted: string | undefined;

    if (defaultLine && defaultLine[1]) {
        const parts = defaultLine[1].split(",").map((p) => p.trim());
        for (const part of parts) {
            const lower = part.toLowerCase();
            if (lower.includes("incoming")) {
                defaultIncoming = part.split("(")[0]?.trim();
            } else if (lower.includes("outgoing")) {
                defaultOutgoing = part.split("(")[0]?.trim();
            } else if (lower.includes("routed")) {
                defaultRouted = part.split("(")[0]?.trim();
            }
        }
    }

    const status: FirewallStatus = statusLine && statusLine[1]
        ? (statusLine[1].toLowerCase() as FirewallStatus)
        : "unknown";

    return {
        status,
        logging: loggingLine?.[1]?.trim(),
        defaultIncoming,
        defaultOutgoing,
        defaultRouted,
        raw: output.trim()
    };
}

export function parseAppList(output: string): string[] {
    const apps: string[] = [];
    let start = false;
    for (const line of output.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (/available applications:/i.test(trimmed)) {
            start = true;
            continue;
        }
        if (start) {
            apps.push(trimmed);
        }
    }
    return apps;
}

export function parseAppInfo(output: string): { title?: string; description?: string; ports?: string } {
    let title: string | undefined;
    let description: string | undefined;
    let ports: string | undefined;

    const lines = output.split(/\r?\n/);
    let inPorts = false;
    const portLines: string[] = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const titleMatch = /^Title:\s*(.+)$/i.exec(line);
        if (titleMatch) {
            title = titleMatch[1]?.trim();
            inPorts = false;
            continue;
        }

        const descMatch = /^Description:\s*(.+)$/i.exec(line);
        if (descMatch) {
            description = descMatch[1]?.trim();
            inPorts = false;
            continue;
        }

        if (/^Ports:/i.test(line)) {
            inPorts = true;
            const remainder = line.replace(/^Ports:\s*/i, "").trim();
            if (remainder) portLines.push(remainder);
            continue;
        }

        if (inPorts) {
            if (/^\w+:/.test(line)) {
                inPorts = false;
            } else {
                portLines.push(line);
            }
        }
    }

    if (portLines.length > 0) {
        ports = portLines.join(", ");
    }

    return { title, description, ports };
}

export function getLocalAppProfiles(appDir = "/etc/ufw/applications.d"): string[] {
    try {
        const { readdirSync, readFileSync, existsSync } = require("node:fs");
        if (!existsSync(appDir)) return [];
        const files: string[] = readdirSync(appDir);
        const apps: string[] = [];
        for (const file of files) {
            const content = readFileSync(`${appDir}/${file}`, "utf-8");
            for (const line of content.split(/\r?\n/)) {
                const match = /^\[([^\]]+)\]/.exec(line.trim());
                if (match && match[1]) {
                    apps.push(match[1].trim());
                }
            }
        }
        return Array.from(new Set(apps)).sort();
    } catch {
        return [];
    }
}