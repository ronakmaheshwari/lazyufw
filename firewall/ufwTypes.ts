type FirewallStatus = "active" | "inactive" | "unknown";

type RuleAction = "ALLOW" | "DENY" | "REJECT" | "LIMIT";

type RuleDirection = "IN" | "OUT";

interface UfwRule {
    id: number,
    to: string,
    action: RuleAction,
    from: string,
    direction: RuleDirection,
    comment?: string
}

interface UfwStatus {
  status: FirewallStatus;
  logging?: string;
  defaultIncoming?: string;
  defaultOutgoing?: string;
  defaultRouted?: string;
  rules: UfwRule[];
}

export type {FirewallStatus, RuleAction, RuleDirection, UfwRule, UfwStatus}