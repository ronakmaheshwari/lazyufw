import { describe, expect, it } from "bun:test";
import { parseSshEnv } from "../security/sshProtection";

describe("SSH Protection Detection", () => {
    it("detects active SSH session from SSH_CLIENT", () => {
        const env = {
            SSH_CLIENT: "203.0.113.195 52410 22",
            SSH_TTY: "/dev/pts/2"
        };
        const res = parseSshEnv(env);
        expect(res.isActive).toBe(true);
        expect(res.clientIp).toBe("203.0.113.195");
        expect(res.serverPort).toBe("22");
        expect(res.tty).toBe("/dev/pts/2");
    });

    it("detects active SSH connection from SSH_CONNECTION", () => {
        const env = {
            SSH_CONNECTION: "192.168.1.50 49152 192.168.1.1 2222"
        };
        const res = parseSshEnv(env);
        expect(res.isActive).toBe(true);
        expect(res.clientIp).toBe("192.168.1.50");
        expect(res.serverPort).toBe("2222");
    });

    it("detects active SSH TTY", () => {
        const env = {
            SSH_TTY: "/dev/pts/0"
        };
        const res = parseSshEnv(env);
        expect(res.isActive).toBe(true);
        expect(res.tty).toBe("/dev/pts/0");
    });

    it("returns inactive when no SSH environment is set", () => {
        const env = {
            USER: "ronak",
            HOME: "/home/ronak"
        };
        const res = parseSshEnv(env);
        expect(res.isActive).toBe(false);
    });
});
