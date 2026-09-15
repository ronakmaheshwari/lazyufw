import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useState, useMemo } from "react";

import Header, { type LogState } from "./components/Header";
import Footer from "./components/Footer";
import StatusPanel from "./screens/StatusPanel";
import RulesPanel from "./screens/RulesPanel";
import RawPanel from "./screens/RawPanel";
import DetailPanel from "./screens/DetailPanel";
import type { RuleCellProp } from "./components/RuleCell";
import AddRuleModal, { type AddRuleFormData } from "./components/addRule";
import ConfigureFirewall from "./components/enableFirewall";
import AppProfilesModal, { type AppProfileItem } from "./components/AppProfilesModal";
import ActionMenuModal from "./components/ActionMenuModal";
import SortModal, { type SortMode } from "./components/SortModal";
import LoggingModal from "./components/LoggingModal";

const MIN_WIDTH = 80;
const MIN_HEIGHT = 20;

const defaultMockRules: RuleCellProp[] = [
  { id: 1, rule: "22/tcp", protocal: "tcp", protocol: "tcp", action: "allow", from: "Anywhere", comment: "SSH service" },
  { id: 2, rule: "80/tcp", protocal: "tcp", protocol: "tcp", action: "allow", from: "Anywhere", comment: "HTTP traffic" },
  { id: 3, rule: "443/tcp", protocal: "tcp", protocol: "tcp", action: "allow", from: "Anywhere", comment: "HTTPS web traffic" },
  { id: 4, rule: "3306/tcp", protocal: "tcp", protocol: "tcp", action: "deny", from: "192.168.1.50", comment: "MySQL blocked" },
  { id: 5, rule: "53/udp", protocal: "udp", protocol: "udp", action: "allow", from: "Anywhere", direction: "OUT", comment: "DNS resolver" },
  { id: 6, rule: "8080/tcp", protocal: "tcp", protocol: "tcp", action: "allow", from: "10.0.0.0/24", comment: "Internal dev" },
  { id: 7, rule: "22/tcp", protocal: "tcp", protocol: "tcp", action: "limit", from: "Anywhere", comment: "Rate limit SSH" },
];

function App() {
  const { width, height } = useTerminalDimensions();
  const [activePanel, setActivePanel] = useState<1 | 2 | 3 | 4>(2);
  const [selectedRuleIndex, setSelectedRuleIndex] = useState(0);
  const [rules, setRules] = useState<RuleCellProp[]>(defaultMockRules);

  // Status & Telemetry state
  const [firewallState, setFirewallState] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [logState, setLogState] = useState<LogState>("Low");
  const [sortMode, setSortMode] = useState<SortMode>("id");
  const [toastMessage, setToastMessage] = useState<string | null>("Welcome to lazyufw — press 'x' for action menu");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [configureFirewallStatus, setConfigureFirewallStatus] = useState<boolean>(false);
  const [enableFirewallStatus, setEnableFirewallStatus] = useState<boolean>(false);
  const [isAppProfilesOpen, setIsAppProfilesOpen] = useState<boolean>(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState<boolean>(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState<boolean>(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);

  // Helper to show transient message
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Sorted rules list
  const sortedRules = useMemo(() => {
    const list = [...rules];
    switch (sortMode) {
      case "action":
        return list.sort((a, b) => a.action.localeCompare(b.action) || a.id - b.id);
      case "to":
        return list.sort((a, b) => a.rule.localeCompare(b.rule) || a.id - b.id);
      case "from":
        return list.sort((a, b) => a.from.localeCompare(b.from) || a.id - b.id);
      case "protocol":
        return list.sort((a, b) => (a.protocol || "any").localeCompare(b.protocol || "any") || a.id - b.id);
      case "id":
      default:
        return list.sort((a, b) => a.id - b.id);
    }
  }, [rules, sortMode]);

  // Selected rule
  const safeIdx = Math.min(selectedRuleIndex, Math.max(0, sortedRules.length - 1));
  const selectedRule = sortedRules[safeIdx];

  // Handler: Add Custom Rule
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
    setSelectedRuleIndex(sortedRules.length);
    setIsAddModalOpen(false);
    showToast(`✓ Added rule #${newRule.id}: ${newRule.rule} (${newRule.action.toUpperCase()})`);
  };

  // Handler: Apply Application Profile
  const handleApplyProfile = (profile: AppProfileItem, action: string) => {
    const nextId = rules.length > 0 ? Math.max(...rules.map((r) => r.id)) + 1 : 1;
    const newRule: RuleCellProp = {
      id: nextId,
      rule: profile.ports,
      protocal: profile.protocol,
      protocol: profile.protocol,
      action: action.toLowerCase() as "allow" | "deny" | "reject" | "limit",
      from: "Anywhere",
      comment: `${profile.name} profile`,
      direction: "IN",
    };
    setRules((prev) => [...prev, newRule]);
    setSelectedRuleIndex(sortedRules.length);
    setIsAppProfilesOpen(false);
    showToast(`✓ Applied profile "${profile.name}" (${action.toUpperCase()})`);
  };

  // Handler: Delete Selected Rule
  const handleDeleteSelectedRule = () => {
    if (!selectedRule) return;
    setRules((prev) => prev.filter((r) => r.id !== selectedRule.id));
    setSelectedRuleIndex((prev) => Math.max(0, prev - 1));
    showToast(`✓ Deleted rule #${selectedRule.id} (${selectedRule.rule})`);
  };

  // Handler: Action Menu execution
  const handleActionMenuSelect = (actionId: string) => {
    setIsActionMenuOpen(false);
    switch (actionId) {
      case "add_rule":
        setIsAddModalOpen(true);
        break;
      case "app_profiles":
        setIsAppProfilesOpen(true);
        break;
      case "sort_rules":
        setIsSortModalOpen(true);
        break;
      case "log_modal":
        setIsLogModalOpen(true);
        break;
      case "enable_fw":
        setEnableFirewallStatus(true);
        break;
      case "disable_fw":
        setConfigureFirewallStatus(true);
        break;
      case "reset_rules":
        setRules(defaultMockRules);
        setSelectedRuleIndex(0);
        showToast("✓ Reset firewall rules to default set");
        break;
      case "quit":
        process.exit(0);
        break;
    }
  };

  // Guard: Any modal open
  const isAnyModalOpen =
    isAddModalOpen ||
    configureFirewallStatus ||
    enableFirewallStatus ||
    isAppProfilesOpen ||
    isActionMenuOpen ||
    isSortModalOpen ||
    isLogModalOpen;

  useKeyboard((e) => {
    if (isAnyModalOpen) return;

    // Panel navigation
    if (e.name === "1") setActivePanel(1);
    else if (e.name === "2") setActivePanel(2);
    else if (e.name === "3") setActivePanel(3);
    else if (e.name === "4") setActivePanel(4);
    else if (e.name === "tab") {
      setActivePanel((prev) => ((prev % 4) + 1) as 1 | 2 | 3 | 4);
    } else if (e.name === "S-tab") {
      setActivePanel((prev) => (prev === 1 ? 4 : ((prev - 1) as 1 | 2 | 3 | 4)));
    }

    // Rules navigation
    else if (e.name === "up" || e.name === "k") {
      setSelectedRuleIndex((prev) => Math.max(0, prev - 1));
    } else if (e.name === "down" || e.name === "j") {
      setSelectedRuleIndex((prev) => Math.min(sortedRules.length - 1, prev + 1));
    }

    // Core actions
    else if (e.name === "a") {
      setIsAddModalOpen(true);
    } else if (e.name === "p" || e.name === "P") {
      setIsAppProfilesOpen(true);
    } else if (e.name === "x") {
      setIsActionMenuOpen(true);
    } else if (e.name === "o") {
      setIsSortModalOpen(true);
    } else if (e.name === "l" || e.name === "L") {
      setIsLogModalOpen(true);
    } else if (e.name === "e") {
      setEnableFirewallStatus(true);
    } else if (e.name === "D" || (e.shift && e.name === "d")) {
      setConfigureFirewallStatus(true);
    } else if (e.name === "d") {
      handleDeleteSelectedRule();
    } else if (e.name === "r") {
      setRules(defaultMockRules);
      setSelectedRuleIndex(0);
      showToast("✓ Reset rules to default");
    } else if (e.name === "q") {
      process.exit(0);
    }
  });

  // Minimum Terminal Dimensions Warning
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
          title=" Terminal Dimensions Warning "
          titleColor="#ef4444"
          padding={1}
          paddingLeft={3}
          paddingRight={3}
          flexDirection="column"
          alignItems="center"
          gap={1}
          backgroundColor="#16161e"
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
            Please resize or maximize your terminal window to continue.
          </text>
        </box>
      </box>
    );
  }

  return (
    <box
      flexGrow={1}
      flexDirection="column"
      width="100%"
      height="100%"
      padding={0}
      backgroundColor="#0f0f13"
    >
      {/* Top Header */}
      <Header
        title="Lazy UFW"
        status={firewallState}
        log={logState !== "Off"}
        logState={logState}
        rulesCount={rules.length}
      />

      {/* Main Content: 2 Columns with collapsible stacks */}
      <box flexDirection="row" flexGrow={1} width="100%">
        {/* Left Stack: [1] Status & [2] Rules */}
        <box flexDirection="column" width="50%" flexGrow={1}>
          <StatusPanel
            active={activePanel === 1}
            state={firewallState}
            log={logState !== "Off"}
            logState={logState}
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
            rules={sortedRules}
            selectedIndex={safeIdx}
            sortMode={sortMode}
          />
        </box>

        {/* Right Stack: [3] Raw Output & [4] Detail */}
        <box flexDirection="column" width="50%" flexGrow={1}>
          <RawPanel active={activePanel === 3} />

          <DetailPanel
            active={activePanel === 4}
            rule={selectedRule}
          />
        </box>
      </box>

      {/* Transient Toast Bar */}
      {toastMessage && (
        <box
          height={1}
          paddingLeft={2}
          paddingRight={2}
          backgroundColor="#16161e"
          justifyContent="flex-start"
          alignItems="center"
        >
          <text fg="#38bdf8">
            <b>{toastMessage}</b>
          </text>
        </box>
      )}

      {/* Bottom Keycap Footer */}
      <Footer activePanel={activePanel} />

      {/* Modal: Add Rule [a] */}
      {isAddModalOpen && (
        <AddRuleModal
          onSubmit={handleAddRule}
          onCancel={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Modal: Application Profiles [P] */}
      {isAppProfilesOpen && (
        <AppProfilesModal
          onApply={handleApplyProfile}
          onCancel={() => setIsAppProfilesOpen(false)}
        />
      )}

      {/* Modal: Action Menu [x] */}
      {isActionMenuOpen && (
        <ActionMenuModal
          onSelect={handleActionMenuSelect}
          onCancel={() => setIsActionMenuOpen(false)}
        />
      )}

      {/* Modal: Sort Rules [o] */}
      {isSortModalOpen && (
        <SortModal
          currentSort={sortMode}
          onSelect={(mode) => {
            setSortMode(mode);
            setIsSortModalOpen(false);
            showToast(`✓ Sorted rules list by ${mode.toUpperCase()}`);
          }}
          onCancel={() => setIsSortModalOpen(false)}
        />
      )}

      {/* Modal: Logging Level [L] */}
      {isLogModalOpen && (
        <LoggingModal
          currentLevel={logState}
          onSelect={(lvl) => {
            setLogState(lvl);
            setIsLogModalOpen(false);
            showToast(`✓ Firewall logging level set to ${lvl.toUpperCase()}`);
          }}
          onCancel={() => setIsLogModalOpen(false)}
        />
      )}

      {/* Modal: Disable Firewall Confirmation */}
      {configureFirewallStatus && (
        <ConfigureFirewall
          title="Are you sure you want to disable the UFW firewall?"
          onCancel={() => setConfigureFirewallStatus(false)}
          onConfirm={() => {
            setFirewallState("INACTIVE");
            setConfigureFirewallStatus(false);
            showToast("⚠️ Firewall protection has been DISABLED!");
          }}
        />
      )}

      {/* Modal: Enable Firewall Confirmation */}
      {enableFirewallStatus && (
        <ConfigureFirewall
          title="Do you want to activate the UFW firewall protection?"
          onCancel={() => setEnableFirewallStatus(false)}
          onConfirm={() => {
            setFirewallState("ACTIVE");
            setEnableFirewallStatus(false);
            showToast("🛡️ Firewall protection is now ACTIVE!");
          }}
        />
      )}
    </box>
  );
}

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  backgroundColor: "#0f0f13",
});

createRoot(renderer).render(<App />);