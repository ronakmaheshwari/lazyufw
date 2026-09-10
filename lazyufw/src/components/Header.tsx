export type LogState = "Low" | "Medium" | "High" | "Off";

interface HeaderProps {
  title: string;
  status: string;
  log: boolean;
  logState: LogState;
  rulesCount: number;
}

const Header = ({
  title,
  status,
  log,
  logState,
  rulesCount,
}: HeaderProps) => {
  const statusColor = status === "ACTIVE" ? "#00ff08" : "#fd1414";
  const logColor = log ? "#00ff08" : "#fd1414";

  return (
    <box
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      width="100%"
      height={5}
      paddingLeft={2}
      paddingRight={2}
      border
      borderColor={"#01afc6"}
      borderStyle="rounded"
    >
      <box
        flexDirection="column"
        alignItems="flex-start"
        justifyContent="center"
      >
        <ascii-font
          id="title"
          font="tiny"
          text={title}
          color={"#00ffea"}
        />

        <text>
          Your laziest way to handle firewall
        </text>
      </box>

      <box
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        gap={3}
        flexGrow={1}
      >
        <text>
          | Status:{" "}
          <span fg={statusColor}>{"● " + status}</span> |
        </text>

        <text>
          Logs:{" "}
          <span fg={logColor}>{log ? "● ON" : "● OFF"} {`(${logState})`}</span> |
        </text>

        <text>
          Rules: {rulesCount}
        </text>
      </box>
    </box>
  );
};

export default Header;