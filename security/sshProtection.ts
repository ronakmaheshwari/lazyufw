import type { SshSessionInfo } from "../firewall/ufwTypes";
import execute from "../utils/exec";

/**
 * Parses SSH session variables from the environment.
 */
export function parseSshEnv(env: NodeJS.ProcessEnv = process.env): SshSessionInfo {
    const client = env.SSH_CLIENT;
    const connection = env.SSH_CONNECTION;
    const tty = env.SSH_TTY;

    if (client) {
        const [clientIp, clientPort, serverPort] = client.trim().split(/\s+/);
        return {
            isActive: true,
            clientIp,
            clientPort,
            serverPort: serverPort || "22",
            tty,
            details: `Active SSH session from ${clientIp}:${clientPort || "unknown"} (port ${serverPort || "22"})${tty ? ` on ${tty}` : ""}`
        };
    }

    if (connection) {
        const [clientIp, clientPort, , serverPort] = connection.trim().split(/\s+/);
        return {
            isActive: true,
            clientIp,
            clientPort,
            serverPort: serverPort || "22",
            tty,
            details: `Active SSH connection from ${clientIp}:${clientPort || "unknown"} (port ${serverPort || "22"})`
        };
    }

    if (tty) {
        return {
            isActive: true,
            tty,
            details: `Active SSH TTY ${tty}`
        };
    }

    return { isActive: false };
}

export async function detectActiveSshSession(env: NodeJS.ProcessEnv = process.env): Promise<SshSessionInfo> {
    const envInfo = parseSshEnv(env);
    if (envInfo.isActive) {
        return envInfo;
    }
    try {
        const ssRes = await execute("ss", ["-tlpn", "sport = :22"]);
        if (ssRes.code === 0 && ssRes.stdout.includes(":22")) {
            return {
                isActive: true,
                serverPort: "22",
                details: "SSH service is listening on port 22"
            };
        }
    } catch {
    }

    try {
        const systemctlRes = await execute("systemctl", ["is-active", "ssh"]);
        if (systemctlRes.code === 0 && systemctlRes.stdout.trim() === "active") {
            return {
                isActive: true,
                serverPort: "22",
                details: "SSH systemd service is active"
            };
        }
    } catch {
    }

    return { isActive: false };
}
