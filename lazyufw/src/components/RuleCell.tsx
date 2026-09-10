export interface RuleCellProp {
  id: number;
  rule: string;
  protocal?: "tcp" | "udp" | "any";
  protocol?: "tcp" | "udp" | "any";
  action: "allow" | "deny" | "reject" | "limit";
  from: string;
  direction?: "IN" | "OUT";
  comment?: string;
  selected?: boolean;
}

const ACTION_COLORS = {
  allow: { fg: "#4ade80", bg: "#143823" },
  deny: { fg: "#f87171", bg: "#3b171c" },
  reject: { fg: "#fb923c", bg: "#3d2814" },
  limit: { fg: "#c084fc", bg: "#2d1c3d" },
};

const RuleCell = ({
  id,
  rule,
  action,
  from,
  direction = "IN",
  comment,
  selected = false,
}: RuleCellProp) => {
  const badge = ACTION_COLORS[action] || ACTION_COLORS.allow;

  return (
    <box
      flexDirection="row"
      alignItems="center"
      height={1}
      backgroundColor={selected ? "#1e293b" : undefined}
    >
      {/* Selection indicator & ID */}
      <box width={6}>
        <text fg={selected ? "#00e5ff" : "#475569"}>
          {selected ? "❯ " : "  "}
          <span fg={selected ? "#00e5ff" : "#64748b"}>
            {String(id).padStart(2, "0")}
          </span>
        </text>
      </box>

      {/* Direction */}
      <box width={4}>
        <text fg={direction === "OUT" ? "#fb923c" : "#38bdf8"}>
          {direction === "OUT" ? "→ " : "← "}
        </text>
      </box>

      {/* Target / Port / Rule */}
      <box width={14}>
        <text fg={selected ? "#ffffff" : "#e2e8f0"}>
          <b>{rule}</b>
        </text>
      </box>

      {/* Action Badge */}
      <box width={11}>
        <text>
          <span bg={badge.bg} fg={badge.fg}>
            <b>{` ${action.toUpperCase()} `}</b>
          </span>
        </text>
      </box>

      {/* Source (From) */}
      <box width={16}>
        <text fg={selected ? "#ffffff" : "#94a3b8"}>{from}</text>
      </box>

      {/* Comment */}
      {comment && (
        <box flexGrow={1}>
          <text fg="#64748b"># {comment}</text>
        </box>
      )}
    </box>
  );
};

export default RuleCell;