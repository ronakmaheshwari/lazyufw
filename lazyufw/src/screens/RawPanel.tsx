export interface RawPanelProps {
  active?: boolean;
  content?: string;
}

const DEFAULT_RAW_OUTPUT = `Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     ALLOW IN    Anywhere
[ 2] 80/tcp                     ALLOW IN    Anywhere
[ 3] 443/tcp                    ALLOW IN    Anywhere
[ 4] 3306/tcp                   DENY IN     192.168.1.50
[ 5] 53/udp                     ALLOW OUT   Anywhere
[ 6] 8080/tcp                   ALLOW IN    10.0.0.0/24
[ 7] 22/tcp                     LIMIT IN    Anywhere`;

const RawPanel = ({
  active = false,
  content = DEFAULT_RAW_OUTPUT,
}: RawPanelProps) => {
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
        title=" [3] Raw Output "
        titleColor="#64748b"
      >
        <text fg="#64748b">Raw UFW terminal command & output stream</text>
      </box>
    );
  }

  const lines = content.trim().split("\n");

  return (
    <box
      flexDirection="column"
      width="100%"
      flexGrow={1}
      padding={1}
      border
      borderStyle="rounded"
      borderColor="#01afc6"
      title=" [3] Raw Output "
      titleColor="#00e5ff"
    >
      <box flexDirection="column" gap={0} flexGrow={1}>
        {lines.map((line, idx) => {
          let color = "#94a3b8";
          if (line.startsWith("Status: active")) color = "#4ade80";
          else if (line.startsWith("Status:")) color = "#f87171";
          else if (line.startsWith("Logging:")) color = "#38bdf8";
          else if (line.startsWith("[")) color = "#f1f5f9";
          else if (line.includes("--")) color = "#475569";

          return (
            <text key={idx} fg={color}>
              {line}
            </text>
          );
        })}
      </box>
    </box>
  );
};

export default RawPanel;

