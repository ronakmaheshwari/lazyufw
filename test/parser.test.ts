import { describe, expect, it } from "bun:test";
import { parseRules, parseStatus } from "../firewall/ufwParser";

describe("UFW Parser", () => {
    it("parses standard numbered rules with direction", () => {
        const output = `
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     ALLOW IN    Anywhere
[ 2] 80/tcp                     ALLOW IN    Anywhere
[ 3] 443/tcp                    ALLOW IN    Anywhere
`;
        const rules = parseRules(output);
        expect(rules.length).toBe(3);
        expect(rules[0]).toEqual({
            id: 1,
            to: "22/tcp",
            action: "ALLOW",
            direction: "IN",
            from: "Anywhere",
            raw: "[ 1] 22/tcp                     ALLOW IN    Anywhere"
        });
        expect(rules[1]?.id).toBe(2);
        expect(rules[1]?.to).toBe("80/tcp");
    });

    it("parses rules when direction IN is omitted", () => {
        const output = `
[ 1] 80/tcp                     ALLOW       Anywhere
[ 2] 3306                       DENY        192.168.1.50
`;
        const rules = parseRules(output);
        expect(rules.length).toBe(2);
        expect(rules[0]?.direction).toBe("IN");
        expect(rules[0]?.action).toBe("ALLOW");
        expect(rules[1]?.action).toBe("DENY");
        expect(rules[1]?.from).toBe("192.168.1.50");
    });

    it("parses LIMIT and REJECT rules, IPv6, OUT direction, and comments", () => {
        const output = `
[ 1] 22/tcp                     LIMIT IN    Anywhere            # SSH brute force protection
[ 2] 22/tcp (v6)                ALLOW IN    Anywhere (v6)
[ 3] 53/udp                     ALLOW OUT   Anywhere
[ 4] 8080/tcp                   REJECT IN   Anywhere
`;
        const rules = parseRules(output);
        expect(rules.length).toBe(4);
        expect(rules[0]?.action).toBe("LIMIT");
        expect(rules[0]?.comment).toBe("SSH brute force protection");
        expect(rules[1]?.to).toBe("22/tcp (v6)");
        expect(rules[1]?.from).toBe("Anywhere (v6)");
        expect(rules[2]?.direction).toBe("OUT");
        expect(rules[3]?.action).toBe("REJECT");
    });

    it("parses verbose status and default policies", () => {
        const output = `
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip
`;
        const parsed = parseStatus(output);
        expect(parsed.status).toBe("active");
        expect(parsed.logging).toBe("on (low)");
        expect(parsed.defaultIncoming).toBe("deny");
        expect(parsed.defaultOutgoing).toBe("allow");
        expect(parsed.defaultRouted).toBe("disabled");
    });

    it("parses inactive status", () => {
        const output = `Status: inactive`;
        const parsed = parseStatus(output);
        expect(parsed.status).toBe("inactive");
    });
});
