import { UFW_PATH } from "../utils/config";
import type { ExecResult } from "../utils/exec";
import execute from "../utils/exec";
import type { CreateRuleInput, LogLevel } from "./ufwTypes";

const PORT_RE = /^\d{1,5}(:\d{1,5})?$/;
const PROTO_RE = /^(tcp|udp)$/;
const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
const RULE_NUM_RE = /^\d+$/;
const DELETE_RULE_RE = /^\d+$|^(allow|deny|reject|limit)\b.*$/;

function invalid(message: string): ExecResult {
    return { stdout: "", stderr: message, code: 1 };
}

export class ufwClient {
    async status(): Promise<ExecResult> {
        return execute("sudo", [UFW_PATH, "status", "verbose"]);
    }

    async rawRules(): Promise<ExecResult> {
        const res = await execute("sudo", [UFW_PATH, "status", "raw"]);
        if (res.code === 0 && res.stdout.trim()) {
            return res;
        }
        return execute("sudo", [UFW_PATH, "status", "verbose"]);
    }

    async numberedRules(): Promise<ExecResult> {
        return execute("sudo", [UFW_PATH, "status", "numbered"]);
    }

    async allow(port: string, protocol?: string): Promise<ExecResult> {
        if (!PORT_RE.test(port)) return invalid(`Invalid port: ${port}`);
        if (protocol && !PROTO_RE.test(protocol)) return invalid(`Invalid protocol: ${protocol}`);
        const args = [UFW_PATH, "allow", port];
        if (protocol && protocol !== "any") args.push(protocol);
        return execute("sudo", args);
    }

    async deny(port: string, protocol?: string): Promise<ExecResult> {
        if (!PORT_RE.test(port)) return invalid(`Invalid port: ${port}`);
        if (protocol && !PROTO_RE.test(protocol)) return invalid(`Invalid protocol: ${protocol}`);
        const args = [UFW_PATH, "deny", port];
        if (protocol && protocol !== "any") args.push(protocol);
        return execute("sudo", args);
    }

    async reject(port: string, protocol?: string): Promise<ExecResult> {
        if (!PORT_RE.test(port)) return invalid(`Invalid port: ${port}`);
        if (protocol && !PROTO_RE.test(protocol)) return invalid(`Invalid protocol: ${protocol}`);
        const args = [UFW_PATH, "reject", port];
        if (protocol && protocol !== "any") args.push(protocol);
        return execute("sudo", args);
    }

    async limit(port: string, protocol?: string): Promise<ExecResult> {
        if (!PORT_RE.test(port)) return invalid(`Invalid port: ${port}`);
        if (protocol && !PROTO_RE.test(protocol)) return invalid(`Invalid protocol: ${protocol}`);
        const args = [UFW_PATH, "limit", port];
        if (protocol && protocol !== "any") args.push(protocol);
        return execute("sudo", args);
    }

    async createRule(input: CreateRuleInput): Promise<ExecResult> {
        const action = input.action.toLowerCase();
        const args = [UFW_PATH, action];

        if (input.direction) {
            args.push(input.direction.toLowerCase());
        }

        if (input.app && input.app.trim()) {
            const app = input.app.trim();
            if (input.from && input.from.trim()) {
                args.push("from", input.from.trim(), "to", "any", "app", app);
            } else {
                args.push(app);
            }
        } else {
            const port = String(input.port ?? "").trim();
            if (!PORT_RE.test(port)) return invalid(`Invalid port: ${port}`);
            const proto = input.protocol && input.protocol !== "any" ? input.protocol : undefined;
            if (proto && !PROTO_RE.test(proto)) return invalid(`Invalid protocol: ${proto}`);

            if (input.from && input.from.trim()) {
                args.push("from", input.from.trim(), "to", "any", "port", port);
            } else {
                args.push(proto ? `${port}/${proto}` : port);
            }
        }

        if (input.comment && input.comment.trim()) {
            args.push("comment", input.comment.trim());
        }

        return execute("sudo", args);
    }

    async insertRule(rule: number, ipAddr: string, action = "allow"): Promise<ExecResult> {
        if (!Number.isInteger(rule) || rule < 1) return invalid(`Invalid rule number: ${rule}`);
        const trimmedIp = ipAddr.trim();
        if (!IPV4_RE.test(trimmedIp)) return invalid(`Invalid IP address: ${trimmedIp}`);
        return execute("sudo", [UFW_PATH, "insert", rule.toString(), action.toLowerCase(), "from", trimmedIp]);
    }

    async deleteRule(rule: string): Promise<ExecResult> {
        const trimmed = rule.trim();
        if (!DELETE_RULE_RE.test(trimmed)) return invalid(`Invalid rule: ${rule}`);
        const args = RULE_NUM_RE.test(trimmed)
            ? [UFW_PATH, "--force", "delete", trimmed]
            : [UFW_PATH, "--force", "delete", ...trimmed.split(/\s+/)];
        return execute("sudo", args);
    }

    async setLogging(level: LogLevel): Promise<ExecResult> {
        const validLevels: LogLevel[] = ["off", "low", "medium", "high", "full"];
        if (!validLevels.includes(level)) {
            return invalid(`Invalid logging level: ${level}`);
        }
        return execute("sudo", [UFW_PATH, "logging", level]);
    }

    async enableLog(): Promise<ExecResult> {
        return this.setLogging("low");
    }

    async disableLog(): Promise<ExecResult> {
        return this.setLogging("off");
    }

    async listAppProfiles(): Promise<ExecResult> {
        return execute("sudo", [UFW_PATH, "app", "list"]);
    }

    async appProfileInfo(profile: string): Promise<ExecResult> {
        const trimmed = profile.trim();
        if (!trimmed) return invalid("Application profile name required");
        return execute("sudo", [UFW_PATH, "app", "info", trimmed]);
    }

    async allowApp(profile: string, action = "allow"): Promise<ExecResult> {
        const trimmed = profile.trim();
        if (!trimmed) return invalid("Application profile name required");
        const act = action.toLowerCase();
        if (!["allow", "deny", "reject", "limit"].includes(act)) {
            return invalid(`Invalid action: ${action}`);
        }
        return execute("sudo", [UFW_PATH, act, trimmed]);
    }

    async enable(): Promise<ExecResult> {
        return execute("sudo", [UFW_PATH, "--force", "enable"]);
    }

    async disable(): Promise<ExecResult> {
        return execute("sudo", [UFW_PATH, "disable"]);
    }

    async reset(): Promise<ExecResult> {
        return execute("sudo", [UFW_PATH, "--force", "reset"]);
    }

    async assertOk(promise: Promise<ExecResult>): Promise<ExecResult> {
        const result = await promise;
        if (result.code !== 0) {
            throw new Error(result.stderr.trim() || `Command failed with exit code ${result.code}`);
        }
        return result;
    }
}
export const UfwClient = ufwClient;