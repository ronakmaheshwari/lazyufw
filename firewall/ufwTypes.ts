export type FirewallStatus = "active" | "inactive" | "unknown";

export type RuleAction = "ALLOW" | "DENY" | "REJECT" | "LIMIT";

export type RuleDirection = "IN" | "OUT";

export interface UfwRule {
    id: number;
    to: string;
    action: RuleAction;
    from: string;
    direction: RuleDirection;
    comment?: string;
    raw?: string;
}

export interface UfwStatus {
  status: FirewallStatus;
  logging?: string;
  defaultIncoming?: string;
  defaultOutgoing?: string;
  defaultRouted?: string;
  rules: UfwRule[];
  raw?: string;
}

export type LogLevel = "off" | "low" | "medium" | "high" | "full";

export interface AppProfileInfo {
  name: string;
  title?: string;
  description?: string;
  ports?: string;
}

export interface CreateRuleInput {
  action: "allow" | "deny" | "reject" | "limit";
  port?: number | string;
  protocol?: string;
  direction?: "in" | "out";
  from?: string;
  comment?: string;
  app?: string;
}

export interface InsertRuleInput {
  rule: number;
  action?: "allow" | "deny" | "reject" | "limit";
  ipAddr: string;
  port?: string;
  protocol?: string;
  comment?: string;
}

export interface Modal {
  show(): void;
  destroy(): void;
  focus(): void;
}

export interface SshSessionInfo {
  isActive: boolean;
  clientIp?: string;
  clientPort?: string;
  serverPort?: string;
  tty?: string;
  details?: string;
}