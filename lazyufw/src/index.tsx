import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useState } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";
import StatusPanel from "./screens/StatusPanel";
import RulesPanel from "./screens/RulesPanel";
import RawPanel from "./screens/RawPanel";
import DetailPanel from "./screens/DetailPanel";
import type { RuleCellProp } from "./components/RuleCell";
import AddRuleModal, { type AddRuleFormData } from "./components/addRule";
import ConfigureFirewall from "./components/enableFirewall";

const MIN_WIDTH = 80;
const MIN_HEIGHT = 24;

const mockRules: RuleCellProp[] = [
  { id: 1, rule: "22/tcp", protocal: "tcp", action: "allow", from: "Anywhere", comment: "SSH service" },
  { id: 2, rule: "80/tcp", protocal: "tcp", action: "allow", from: "Anywhere", comment: "HTTP traffic" },
  { id: 3, rule: "443/tcp", protocal: "tcp", action: "allow", from: "Anywhere", comment: "HTTPS web traffic" },
  { id: 4, rule: "3306/tcp", protocal: "tcp", action: "deny", from: "192.168.1.50", comment: "MySQL blocked" },
  { id: 5, rule: "53/udp", protocal: "udp", action: "allow", from: "Anywhere", direction: "OUT", comment: "DNS resolver" },
  { id: 6, rule: "8080/tcp", protocal: "tcp", action: "allow", from: "10.0.0.0/24", comment: "Internal dev" },
  { id: 7, rule: "22/tcp", protocal: "tcp", action: "limit", from: "Anywhere", comment: "Rate limit SSH" },
];

function App() {
  const { width, height } = useTerminalDimensions();
  const [activePanel, setActivePanel] = useState<1 | 2 | 3 | 4>(2);
  const [selectedRuleIndex, setSelectedRuleIndex] = useState(0);
  const [rules, setRules] = useState<RuleCellProp[]>(mockRules);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [configureFirewallStatus, setConfigureFirewallStatus] = useState<boolean>(false)

  const handleAddRule = (data: AddRuleFormData) => {
    const nextId = rules.length > 0 ? Math.max(...rules.map((r) => r.id)) + 1 : 1;
    const protoSuffix = data.protocol === "ANY" ? "" : `/${data.protocol.toLowerCase()}`;
    const newRule: RuleCellProp = {
      id: nextId,
      rule: `${data.port}${protoSuffix}`,
      protocal: data.protocol === "ANY" ? "any" : (data.protocol.toLowerCase() as "tcp" | "udp"),
      protocol: data.protocol === "ANY" ? "any" : (data.protocol.toLowerCase() as "tcp" | "udp"),
      action: data.action.toLowerCase() as "allow" | "deny" | "reject" | "limit",
      from: data.from || "Anywhere",
      comment: data.comment || undefined,
      direction: "IN",
    };
    setRules((prev) => [...prev, newRule]);
    setSelectedRuleIndex(rules.length);
    setIsAddModalOpen(false);
    setConfigureFirewallStatus(false);
  };

  useKeyboard((e) => {
    if (isAddModalOpen) return;
    if (configureFirewallStatus) return;

    if (e.name === "1") {
      setActivePanel(1);
    } else if (e.name === "2") {
      setActivePanel(2);
    } else if (e.name === "3") {
      setActivePanel(3);
    } else if (e.name === "4") {
      setActivePanel(4);
    } else if (e.name === "tab") {
      setActivePanel((prev) => ((prev % 4) + 1) as 1 | 2 | 3 | 4);
    } else if (e.name === "S-tab") {
      setActivePanel((prev) => (prev === 1 ? 4 : (prev - 1) as 1 | 2 | 3 | 4));
    } else if (e.name === "up" || e.name === "k") {
      setSelectedRuleIndex((prev) => Math.max(0, prev - 1));
    } else if (e.name === "down" || e.name === "j") {
      setSelectedRuleIndex((prev) => Math.min(rules.length - 1, prev + 1));
    } else if (e.name === "q") {
      process.exit(0);
    } else if (e.name === "a") {
      setIsAddModalOpen(true);
    } else if (e.name === "d") {
      setConfigureFirewallStatus(true);
    }
  });

  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    return (
      <box
        flexGrow={1}
        width="100%"
        height="100%"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        backgroundColor="#0f0f13"
      >
        <box
          border
          borderStyle="rounded"
          borderColor="#ef4444"
          title=" Terminal Size Warning "
          titleColor="#ef4444"
          padding={1}
          paddingLeft={3}
          paddingRight={3}
          flexDirection="column"
          alignItems="center"
          gap={1}
        >
          <text fg="#ef4444">
            <b>⚠️  Terminal window is too small!</b>
          </text>
          <text fg="#f1f5f9">
            Current size:  <b fg="#fb923c">{width}</b> cols × <b fg="#fb923c">{height}</b> rows
          </text>
          <text fg="#94a3b8">
            Minimum needed: <b fg="#4ade80">{MIN_WIDTH}</b> cols × <b fg="#4ade80">{MIN_HEIGHT}</b> rows
          </text>
          <text fg="#64748b">
            Please resize or zoom out your terminal window.
          </text>
        </box>
      </box>
    );
  }

  const selectedRule = rules[selectedRuleIndex];

  return (
    <box
      flexGrow={1}
      flexDirection="column"
      width="100%"
      height="100%"
      padding={0}
    >
      <Header
        title="Lazy UFW"
        status="ACTIVE"
        log={false}
        logState="Low"
        rulesCount={rules.length}
      />

      <box flexDirection="row" flexGrow={1} width="100%">
        <box flexDirection="column" width="50%" flexGrow={1}>
          <StatusPanel
            active={activePanel === 1}
            state="ACTIVE"
            log={false}
            logState="Low"
            ruleCount={rules.length}
            auth="ENABLED"
            policy={{
              in: false,
              out: true,
              route: false,
            }}
          />

          <RulesPanel
            active={activePanel === 2}
            rules={rules}
            selectedIndex={selectedRuleIndex}
          />
        </box>

        <box flexDirection="column" width="50%" flexGrow={1}>
          <RawPanel active={activePanel === 3} />

          <DetailPanel
            active={activePanel === 4}
            rule={selectedRule}
          />
        </box>
      </box>

      <Footer activePanel={activePanel} />

      {isAddModalOpen && (
        <AddRuleModal
          onSubmit={handleAddRule}
          onCancel={() => setIsAddModalOpen(false)}
        />
      )}

      {configureFirewallStatus && (
        <ConfigureFirewall
          title="Are you sure you want to disable the UFW firewall?"
        />
      )}
    </box>
  );
}

const renderer = await createCliRenderer({
  exitOnCtrlC: true ,
  backgroundColor: "#0f0f13",
});

createRoot(renderer).render(<App />);