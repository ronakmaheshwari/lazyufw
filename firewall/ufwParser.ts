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