import type { RuleAction, RuleDirection, UfwRule } from "./ufwTypes";

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
