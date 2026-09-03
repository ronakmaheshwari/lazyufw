import { UFW_PATH } from "../utils/config";
import type { ExecResult } from "../utils/exec";
import execute from "../utils/exec";

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
        return execute("sudo", [UFW_PATH, "status", "raw"]);
    }

    async numberedRules(): Promise<ExecResult> {
        return execute("sudo", [UFW_PATH, "status", "numbered"]);
    }

    async allow(port: string, protocol?: string): Promise<ExecResult> {
        if (!PORT_RE.test(port)) return invalid(`Invalid port: ${port}`);
        if (protocol && !PROTO_RE.test(protocol)) return invalid(`Invalid protocol: ${protocol}`);
        const args = [UFW_PATH, "allow", port];
        if (protocol) args.push(protocol);
        return execute("sudo", args);
    }

    async deny(port: string, protocol?: string): Promise<ExecResult> {
        if (!PORT_RE.test(port)) return invalid(`Invalid port: ${port}`);
        if (protocol && !PROTO_RE.test(protocol)) return invalid(`Invalid protocol: ${protocol}`);
        const args = [UFW_PATH, "deny", port];
        if (protocol) args.push(protocol);
        return execute("sudo", args);
    }

    async insertRule(rule: number, ipAddr: string): Promise<ExecResult> {
        if (!Number.isInteger(rule) || rule < 1) return invalid(`Invalid rule number: ${rule}`);
        if (!IPV4_RE.test(ipAddr)) return invalid(`Invalid IP address: ${ipAddr}`);
        return execute("sudo", [UFW_PATH, "insert", rule.toString(), "allow", "from", ipAddr]);
    }

    async deleteRule(rule: string): Promise<ExecResult> {
        if (!DELETE_RULE_RE.test(rule.trim())) return invalid(`Invalid rule: ${rule}`);
        const args = RULE_NUM_RE.test(rule.trim())
            ? [UFW_PATH, "delete", rule.trim()]
            : [UFW_PATH, "delete", ...rule.trim().split(/\s+/)];
        return execute("sudo", args);
    }

    async enableLog(): Promise<ExecResult> {
        return execute("sudo", [UFW_PATH, "logging", "on"]);
    }

    async disableLog(): Promise<ExecResult> {
        return execute("sudo", [UFW_PATH, "logging", "off"]);
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
}

// Keep the conventional PascalCase name available to UI components.
export const UfwClient = ufwClient;