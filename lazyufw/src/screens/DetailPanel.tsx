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
        borderColor="#2a324b"
        title=" [4] Detail "
        titleColor="#64748b"
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
        title=" [4] Detail "
        titleColor="#00e5ff"
      >
        <text fg="#00e5ff">
          <b>Firewall Rule Inspector</b>
        </text>
        <box height={1} />
        <text fg="#64748b">
          Select a rule on the left [2] to inspect details, actions, and raw commands.
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

  return (
    <box
      flexDirection="column"
      width="100%"
      flexGrow={1}
      padding={1}
      border
      borderStyle="rounded"
      borderColor="#01afc6"
      title=" [4] Detail "
      titleColor="#00e5ff"
    >
      <text fg="#00e5ff">
        <b>{`RULE INSPECTION — #${rule.id}`}</b>
      </text>

      <box height={1} marginY={0}>
        <text fg="#1e293b">
          ──────────────────────────────────────────────────────────
        </text>
      </box>

      {/* Attributes */}
      <box flexDirection="column" gap={0}>
        <box flexDirection="row" alignItems="center" gap={1}>
          <box width={14}>
            <text fg="#7982a9">Action:</text>
          </box>
          <text>
            <span bg={badge.bg} fg={badge.fg}>
              <b>{` ${rule.action.toUpperCase()} `}</b>
            </span>
          </text>
        </box>

        <box flexDirection="row" alignItems="center" gap={1}>
          <box width={14}>
            <text fg="#7982a9">Direction:</text>
          </box>
          <text fg="#f1f5f9">{directionText}</text>
        </box>

        <box flexDirection="row" alignItems="center" gap={1}>
          <box width={14}>
            <text fg="#7982a9">Destination:</text>
          </box>
          <text fg="#f1f5f9">
            <b>{rule.rule}</b>
          </text>
        </box>

        <box flexDirection="row" alignItems="center" gap={1}>
          <box width={14}>
            <text fg="#7982a9">Source:</text>
          </box>
          <text fg="#f1f5f9">{rule.from}</text>
        </box>

        <box flexDirection="row" alignItems="center" gap={1}>
          <box width={14}>
            <text fg="#7982a9">Protocol:</text>
          </box>
          <text fg="#38bdf8">{proto.toUpperCase()}</text>
        </box>

        {rule.comment && (
          <box flexDirection="row" alignItems="center" gap={1}>
            <box width={14}>
              <text fg="#7982a9">Comment:</text>
            </box>
            <text fg="#fbbf24">{rule.comment}</text>
          </box>
        )}
      </box>

      <box height={1} marginY={0}>
        <text fg="#1e293b">
          ──────────────────────────────────────────────────────────
        </text>
      </box>

      {/* CLI Equivalence */}
      <box flexDirection="column" gap={0}>
        <text fg="#7982a9">
          <b>CLI Equivalence:</b>
        </text>
        <text fg="#4ade80">{`  $ ${cmd}`}</text>
        <text fg="#64748b">{`  $ sudo ufw delete ${rule.id}`}</text>
      </box>

      <box height={1} marginY={0}>
        <text fg="#1e293b">
          ──────────────────────────────────────────────────────────
        </text>
      </box>

      {/* Keyboard Shortcuts */}
      <box flexDirection="column" gap={0}>
        <text fg="#7982a9">
          <b>Shortcuts for this rule:</b>
        </text>
        <text fg="#94a3b8">{`  Press [d] to delete rule #${rule.id}`}</text>
        <text fg="#94a3b8">{`  Press [i] to insert rule before #${rule.id}`}</text>
      </box>
    </box>
  );
};

export default DetailPanel;

