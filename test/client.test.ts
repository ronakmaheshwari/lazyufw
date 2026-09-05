import { describe, expect, it } from "bun:test";
import { ufwClient } from "../firewall/ufwClient";

describe("ufwClient Validation", () => {
    const client = new ufwClient();

    it("rejects invalid ports on allow/deny/reject/limit", async () => {
        const resAllow = await client.allow("abc");
        expect(resAllow.code).toBe(1);
        expect(resAllow.stderr).toContain("Invalid port: abc");

        const resDeny = await client.deny("9999999");
        expect(resDeny.code).toBe(1);
        expect(resDeny.stderr).toContain("Invalid port: 9999999");

        const resProto = await client.allow("80", "invalid_proto");
        expect(resProto.code).toBe(1);
        expect(resProto.stderr).toContain("Invalid protocol");
    });

    it("validates rule number and IP address in insertRule", async () => {
        const resInvalidNum = await client.insertRule(0, "192.168.1.1");
        expect(resInvalidNum.code).toBe(1);
        expect(resInvalidNum.stderr).toContain("Invalid rule number");

        const resInvalidIp = await client.insertRule(1, "999.999.999.9999");
        expect(resInvalidIp.code).toBe(1);
        expect(resInvalidIp.stderr).toContain("Invalid IP address");
    });

    it("rejects invalid delete rules", async () => {
        const res = await client.deleteRule("; rm -rf /");
        expect(res.code).toBe(1);
        expect(res.stderr).toContain("Invalid rule");
    });

    it("assertOk throws on non-zero exit code", async () => {
        const failedPromise = Promise.resolve({ stdout: "", stderr: "Permission denied", code: 1 });
        expect(client.assertOk(failedPromise)).rejects.toThrow("Permission denied");
    });

    it("rejects invalid logging levels in setLogging", async () => {
        const res = await client.setLogging("bogus" as never);
        expect(res.code).toBe(1);
        expect(res.stderr).toContain("Invalid logging level");
    });

    it("rejects empty or invalid application profile names in allowApp", async () => {
        const resEmpty = await client.allowApp("   ");
        expect(resEmpty.code).toBe(1);
        expect(resEmpty.stderr).toContain("Application profile name required");

        const resBadAction = await client.allowApp("OpenSSH", "explode");
        expect(resBadAction.code).toBe(1);
        expect(resBadAction.stderr).toContain("Invalid action");
    });
});
