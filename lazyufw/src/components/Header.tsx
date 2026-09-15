export type LogState = "Low" | "Medium" | "High" | "Off";

interface HeaderProps {
  title?: string;
  status: string;
  log?: boolean;
  logState: LogState;
  rulesCount: number;
}

const Header = ({
  status,
  logState,
  rulesCount,
}: HeaderProps) => {
  const isActive = status.toUpperCase() === "ACTIVE";

  return (
    <box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      width="100%"
      height={4}
      paddingLeft={2}
      paddingRight={2}
      border
      borderColor="#01afc6"
      borderStyle="rounded"
      backgroundColor="#16161e"
    >
      {/* Brand & Slogan */}
      <box flexDirection="column" justifyContent="center">
        <box flexDirection="row" alignItems="center" gap={1}>
          <text fg="#00e5ff">
            <b>⚡ LAZYUFW</b>
          </text>
          <text>
            <span bg="#1e293b" fg="#38bdf8">
              <b> v1.2.0 </b>
            </span>
          </text>
        </box>
        <text fg="#64748b">
          TUI Manager for Uncomplicated Firewall
        </text>
      </box>

      {/* Status Chips */}
      <box flexDirection="row" alignItems="center" gap={2}>
        {/* Status Badge */}
        <text>
          {isActive ? (
            <span bg="#143823" fg="#22c55e">
              <b> ● ACTIVE </b>
            </span>
          ) : (
            <span bg="#3b171c" fg="#ef4444">
              <b> ○ INACTIVE </b>
            </span>
          )}
        </text>

        {/* Logging Badge */}
        <text>
          <span bg="#1e293b" fg="#38bdf8">
            <b> 📋 LOGS: {logState.toUpperCase()} </b>
          </span>
        </text>

        {/* Rule Count Badge */}
        <text>
          <span bg="#1e293b" fg="#f1f5f9">
            <b> 🛡️ {rulesCount} RULES </b>
          </span>
        </text>

        {/* SSH Protection Badge */}
        <text>
          <span bg="#2d1c3d" fg="#c084fc">
            <b> 🔒 SSH SAFE </b>
          </span>
        </text>
      </box>
    </box>
  );
};

export default Header;