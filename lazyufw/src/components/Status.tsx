import type { LogState } from "./Header";

// ── Theme ───────────────────────────────────────────────
export const theme = {
  colors: {
    // Primary brand & panel styling
    border: "#01afc6",
    title: "#00e5ff",
    accent: "#38bdf8",

    // Status badges & indicators
    active: "#22c55e",
    activeBg: "#143823",
    inactive: "#ef4444",
    inactiveBg: "#3b171c",

    // Policy badges
    allow: "#4ade80",
    allowBg: "#143823",
    deny: "#f87171",
    denyBg: "#3b171c",
    disabled: "#94a3b8",
    disabledBg: "#1e293b",

    // Typography & hierarchy
    heading: "#38bdf8",
    label: "#7982a9",
    value: "#f1f5f9",
    subtext: "#64748b",
  },
} as const;

interface PolicyInterface {
  in: boolean;
  out: boolean;
  route: boolean;
}

export interface StatusProps {
  state: string;
  log: boolean;
  logState: LogState;
  policy: PolicyInterface;
  ruleCount: number;
  auth: string;
}

const Status = ({
  state,
  log,
  logState,
  policy,
  ruleCount,
  auth,
}: StatusProps) => {
  const isActive = state.toUpperCase() === "ACTIVE";

  return (
    <box
      flexDirection="column"
      width="50%"
      padding={1}
      border
      borderStyle="rounded"
      borderColor={theme.colors.border}
      title=" [1] Status "
      titleColor={theme.colors.title}
    >
      {/* ── System Overview ──────────────────────────────── */}
      <box flexDirection="column" gap={0}>
        <box flexDirection="row" alignItems="center" gap={2}>
          <text>
            <span fg={theme.colors.label}>State: </span>
            {isActive ? (
              <span bg={theme.colors.activeBg} fg={theme.colors.active}>
                <b> ● ACTIVE </b>
              </span>
            ) : (
              <span bg={theme.colors.inactiveBg} fg={theme.colors.inactive}>
                <b> ○ INACTIVE </b>
              </span>
            )}
          </text>

          <text>
            <span fg={theme.colors.label}>Logs: </span>
            {log ? (
              <span bg={theme.colors.activeBg} fg={theme.colors.active}>
                <b> ● ON </b>
              </span>
            ) : (
              <span bg={theme.colors.disabledBg} fg={theme.colors.disabled}>
                <b> ○ OFF </b>
              </span>
            )}
            <span fg={theme.colors.subtext}> {`(${logState})`}</span>
          </text>
        </box>

        <box flexDirection="row" alignItems="center" gap={2} marginTop={1}>
          <text>
            <span fg={theme.colors.label}>Rules: </span>
            <b fg={theme.colors.value}>{ruleCount}</b>
            <span fg={theme.colors.subtext}> active</span>
          </text>

          <text>
            <span fg={theme.colors.label}>Auth: </span>
            <span fg={theme.colors.accent}>
              ● {auth === "ENABLED" ? "Sudo (NOPASSWD)" : auth}
            </span>
          </text>
        </box>
      </box>

      <box flexDirection="column" marginTop={0} gap={0}>
        <text fg={theme.colors.heading}>
          <b>DEFAULT POLICY:</b>
        </text>

        <box flexDirection="row" alignItems="center" gap={1} marginTop={1}>
          <text>
            {policy.in ? (
              <span bg={theme.colors.allowBg} fg={theme.colors.allow}>
                <b> IN: ALLOW </b>
              </span>
            ) : (
              <span bg={theme.colors.denyBg} fg={theme.colors.deny}>
                <b> IN: DENY </b>
              </span>
            )}
          </text>

          <text>
            {policy.out ? (
              <span bg={theme.colors.allowBg} fg={theme.colors.allow}>
                <b> OUT: ALLOW </b>
              </span>
            ) : (
              <span bg={theme.colors.denyBg} fg={theme.colors.deny}>
                <b> OUT: DENY </b>
              </span>
            )}
          </text>

          <text>
            {policy.route ? (
              <span bg={theme.colors.allowBg} fg={theme.colors.allow}>
                <b> ROUTE: ALLOW </b>
              </span>
            ) : (
              <span bg={theme.colors.disabledBg} fg={theme.colors.disabled}>
                <b> ROUTE: OFF </b>
              </span>
            )}
          </text>
        </box>
      </box>

      <box flexDirection="column" marginTop={0} gap={0}>
        <text fg={theme.colors.heading}>
          <b>LOGGING:</b>
        </text>

        <box flexDirection="row" alignItems="center" gap={2} marginTop={1}>
          <text>
            <span fg={theme.colors.label}>Level: </span>
            <b fg={theme.colors.value}>{logState}</b>
          </text>

          <text>
            <span fg={theme.colors.label}>Status: </span>
            <span fg={log ? theme.colors.active : theme.colors.subtext}>
              {log ? "● Recording" : "○ Disabled"}
            </span>
          </text>
        </box>
      </box>
    </box>
  );
};

export default Status;