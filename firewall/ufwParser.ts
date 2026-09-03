import type { FirewallStatus, RuleAction, RuleDirection, UfwRule, UfwStatus } from "./ufwTypes";

const NUMBERED_RULE =
    /^\[\s*(\d+)\]\s+(.+?)\s+(ALLOW|DENY|REJECT|LIMIT)\s+(IN|OUT)\s+(.+?)(?:\s+#(.+))?$/;

export function parseRules(output: string): UfwRule[] {
    const rules: UfwRule[] = [];
    for (const line of output.split(/\r?\n/)) {
        const match = NUMBERED_RULE.exec(line);
        if (!match) continue;
        const comment = match[6]?.trim();
        rules.push({
            id: Number(match[1]),
            to: match[2]!.trim(),
            action: match[3] as RuleAction,
            direction: match[4] as RuleDirection,
            from: match[5]!.trim(),
            ...(comment ? { comment } : {})
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

    if (defaultLine) {
        const parts = defaultLine[1]!.split(",").map((p) => p.trim());
        for (const part of parts) {
            if (part.includes("incoming")) defaultIncoming = part.split("(")[0]!.trim();
            else if (part.includes("outgoing")) defaultOutgoing = part.split("(")[0]!.trim();
            else if (part.includes("routed")) defaultRouted = part.split("(")[0]!.trim();
        }
    }

    const status: FirewallStatus = statusLine
        ? (statusLine[1]!.toLowerCase() as FirewallStatus)
        : "unknown";

    return {
        status,
        logging: loggingLine?.[1]?.trim(),
        defaultIncoming,
        defaultOutgoing,
        defaultRouted
    };
}