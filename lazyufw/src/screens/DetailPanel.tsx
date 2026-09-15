import type { RuleCellProp } from "../components/RuleCell";

export interface DetailPanelProps {
  rule?: RuleCellProp;
  active?: boolean;
}

const ACTION_COLORS = {
  allow: { fg: "#4ade80", bg: "#143823" },
  deny: { fg: "#f87171", bg: "#3b171c" },
  reject: { fg: "#fb923c", bg: "#3d2814" },
  limit: { fg: "#c084fc", bg: "#2d1c3d" },
};

function getSecurityBadge(rule: RuleCellProp) {
  const isAnywhere = rule.from.toLowerCase() === "anywhere" || rule.from === "0.0.0.0/0";
  const portStr = rule.rule.toLowerCase();

  if (rule.action === "deny" || rule.action === "reject") {
    return {
      bg: "#143823",
      fg: "#4ade80",
      label: "🛡️ BLOCKED: Unauthorized access stopped",
    };
  }

  if (isAnywhere && (portStr.startsWith("3306") || portStr.startsWith("5432") || portStr.startsWith("6379") || portStr.startsWith("27017"))) {
    return {
      bg: "#3b171c",
      fg: "#ef4444",
      label: "🚨 HIGH RISK: Database port open to the public internet!",
    };
  }

  if (isAnywhere && portStr.startsWith("22")) {
    return {
      bg: "#3d2814",
      fg: "#fb923c",
      label: "⚠️ MODERATE RISK: SSH open globally (rate-limiting advised)",
    };
  }

  if (isAnywhere && (portStr.startsWith("80") || portStr.startsWith("443"))) {
    return {
      bg: "#1e293b",
      fg: "#38bdf8",
      label: "🌐 STANDARD WEB: Public HTTP/HTTPS traffic",
    };
  }

  return {
    bg: "#1e293b",
    fg: "#94a3b8",
    label: "✓ NORMAL: Standard filtering rule",
  };
}

const DetailPanel = ({ rule, active = true }: DetailPanelProps) => {
  if (!active) {
    return (
      <box
        flexDirection="row"
        alignItems="center"
        width="100%"
        height={3}
        paddingLeft={2}
        paddingRight={2}
        border
        borderStyle="rounded"
        borderColor="#23283b"
        title=" [4] Inspector "
        titleColor="#64748b"
        backgroundColor="#16161e"
      >
        <text fg="#64748b">
          {rule
            ? `Inspecting rule #${rule.id} (${rule.rule})`
            : "Rule inspection & CLI commands"}
        </text>
      </box>
    );
  }

  if (!rule) {
    return (
      <box
        flexDirection="column"
        width="100%"
        flexGrow={1}
        padding={1}
        border
        borderStyle="rounded"
        borderColor="#01afc6"
        title=" [4] Inspector "
        titleColor="#00e5ff"
        backgroundColor="#16161e"
      >
        <text fg="#00e5ff">
          <b>Firewall Rule Inspector</b>
        </text>
        <box height={1} />
        <text fg="#64748b">
          Select a rule on the left [2] to inspect security evaluation, metadata, and raw commands.
        </text>
      </box>
    );
  }

  const badge = ACTION_COLORS[rule.action] || ACTION_COLORS.allow;
  const proto = rule.protocol || rule.protocal || "any";
  const directionText =
    rule.direction === "OUT" ? "OUTGOING (OUT →)" : "INCOMING (IN ←)";

  const cleanPort = rule.rule.replace(/\/(tcp|udp)$/i, "");
  const cmd =
    rule.from.toLowerCase() === "anywhere"
      ? `sudo ufw ${rule.action} ${rule.rule}`
      : `sudo ufw ${rule.action} from ${rule.from} to any port ${cleanPort} proto ${proto}`;

  const sec = getSecurityBadge(rule);

  return (
    <box
      flexDirection="column"
      width="100%"
      flexGrow={1}
      padding={1}
      border
      borderStyle="rounded"
      borderColor="#01afc6"
      title=" [4] Inspector "
      titleColor="#00e5ff"
      backgroundColor="#16161e"
      gap={1}
    >
      {/* Title & Security Banner */}
      <box flexDirection="column" gap={0}>
        <box flexDirection="row" alignItems="center" gap={1}>
          <text fg="#00e5ff">
            <b>{`RULE INSPECTOR — #${rule.id}`}</b>
          </text>
          <text>
            <span bg={badge.bg} fg={badge.fg}>
              <b>{` ${rule.action.toUpperCase()} `}</b>
            </span>
          </text>
        </box>

        <box marginTop={1}>
          <text>
            <span bg={sec.bg} fg={sec.fg}>
              <b> {sec.label} </b>
            </span>
          </text>
        </box>
      </box>

      {/* Metadata Grid */}
      <box
        flexDirection="column"
        padding={1}
        backgroundColor="#1a1b26"
        border
        borderStyle="rounded"
        borderColor="#2a324b"
        gap={0}
      >
        <box flexDirection="row" alignItems="center">
          <box width={16}>
            <text fg="#7982a9">Target / Port:</text>
          </box>
          <text fg="#f1f5f9">
            <b>{rule.rule}</b>
          </text>
        </box>

        <box flexDirection="row" alignItems="center">
          <box width={16}>
            <text fg="#7982a9">Direction:</text>
          </box>
          <text fg="#f1f5f9">{directionText}</text>
        </box>

        <box flexDirection="row" alignItems="center">
          <box width={16}>
            <text fg="#7982a9">Source (From):</text>
          </box>
          <text fg="#f1f5f9">{rule.from}</text>
        </box>

        <box flexDirection="row" alignItems="center">
          <box width={16}>
            <text fg="#7982a9">Protocol:</text>
          </box>
          <text fg="#38bdf8">{proto.toUpperCase()}</text>
        </box>

        {rule.comment && (
          <box flexDirection="row" alignItems="center">
            <box width={16}>
              <text fg="#7982a9">Comment:</text>
            </box>
            <text fg="#fbbf24">#{rule.comment}</text>
          </box>
        )}
      </box>

      {/* CLI Equivalence */}
      <box flexDirection="column" gap={0}>
        <text fg="#7982a9">
          <b>Equivalent UFW CLI Command:</b>
        </text>
        <box
          padding={1}
          backgroundColor="#12131a"
          border
          borderStyle="rounded"
          borderColor="#23283b"
        >
          <text fg="#4ade80">{`$ ${cmd}`}</text>
        </box>
      </box>

      {/* Quick Shortcuts */}
      <box flexDirection="row" alignItems="center" gap={1}>
        <text fg="#64748b">
          Actions: <span fg="#00e5ff">[d]</span> Delete rule  <span fg="#00e5ff">[a]</span> Add rule  <span fg="#00e5ff">[P]</span> App Profiles
        </text>
      </box>
    </box>
  );
};

export default DetailPanel;
