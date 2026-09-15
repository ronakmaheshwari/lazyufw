import type { LogState } from "./Header";

export const theme = {
  colors: {
    border: "#01afc6",
    title: "#00e5ff",
    accent: "#38bdf8",

    active: "#22c55e",
    activeBg: "#143823",
    inactive: "#ef4444",
    inactiveBg: "#3b171c",

    allow: "#4ade80",
    allowBg: "#143823",
    deny: "#f87171",
    denyBg: "#3b171c",
    disabled: "#94a3b8",
    disabledBg: "#1e293b",

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
  active?: boolean;
}

const Status = ({
  state,
  log,
  logState,
  policy,
  ruleCount,
  auth,
  active = true,
}: StatusProps) => {
  const isActive = state.toUpperCase() === "ACTIVE";

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
        title=" [1] Status "
        titleColor="#64748b"
        backgroundColor="#16161e"
      >
        <box flexDirection="row" alignItems="center" gap={2}>
          <text>
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
            <span fg={theme.colors.label}>Log: </span>
            <span fg={log ? theme.colors.active : theme.colors.disabled}>
              {log ? "● ON" : "○ OFF"}
            </span>
          </text>

          <text>
            <span fg={theme.colors.label}>Rules: </span>
            <b fg={theme.colors.value}>{ruleCount}</b>
          </text>
        </box>
      </box>
    );
  }

  return (
    <box
      flexDirection="column"
      width="100%"
      flexGrow={1}
      padding={1}
      border
      borderStyle="rounded"
      borderColor={theme.colors.border}
      title=" [1] Status "
      titleColor={theme.colors.title}
      backgroundColor="#16161e"
      gap={1}
    >
      {/* State & Core Telemetry */}
      <box flexDirection="column" gap={0}>
        <box flexDirection="row" alignItems="center" gap={2}>
          <text>
            <span fg={theme.colors.label}>Firewall: </span>
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
            <span fg={theme.colors.subtext}> active filter rules</span>
          </text>

          <text>
            <span fg={theme.colors.label}>Auth: </span>
            <span fg={theme.colors.accent}>
              ● {auth === "ENABLED" ? "Sudo (NOPASSWD)" : auth}
            </span>
          </text>
        </box>
      </box>

      {/* Security Posture Rating */}
      <box
        flexDirection="row"
        alignItems="center"
        gap={1}
        paddingLeft={1}
        paddingRight={1}
        backgroundColor="#1a1b26"
        border
        borderStyle="rounded"
        borderColor="#2a324b"
      >
        <text fg="#38bdf8"><b>🛡️ Security Posture:</b></text>
        <text>
          <span bg="#143823" fg="#4ade80">
            <b> PROTECTED (Default Inbound Deny) </b>
          </span>
        </text>
      </box>

      {/* Default Policies */}
      <box flexDirection="column" gap={0}>
        <text fg={theme.colors.heading}>
          <b>DEFAULT TRAFFIC POLICIES:</b>
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

      {/* Interfaces & Logging Status */}
      <box flexDirection="column" gap={0}>
        <text fg={theme.colors.heading}>
          <b>INTERFACES & AUDIT:</b>
        </text>

        <box flexDirection="row" alignItems="center" gap={2} marginTop={1}>
          <text>
            <span fg={theme.colors.label}>Interfaces: </span>
            <span fg="#4ade80">eth0:UP</span> <span fg="#4ade80">wlan0:UP</span>
          </text>

          <text>
            <span fg={theme.colors.label}>Audit: </span>
            <b fg={theme.colors.value}>{logState}</b>
          </text>
        </box>
      </box>
    </box>
  );
};

export default Status;