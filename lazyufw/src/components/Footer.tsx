export interface FooterProps {
  activePanel: number;
}

const PANEL_NAMES: Record<number, string> = {
  1: "Status",
  2: "Rules",
  3: "Raw Output",
  4: "Inspector",
};

const Footer = ({ activePanel }: FooterProps) => {
  return (
    <box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      width="100%"
      height={3}
      paddingLeft={2}
      paddingRight={2}
      border
      borderStyle="rounded"
      borderColor="#23283b"
      backgroundColor="#12131a"
    >
      <box flexDirection="row" alignItems="center" gap={1}>
        <text fg="#94a3b8">
          <span fg="#00e5ff"><b>[1-4]</b></span> Panels  <span fg="#00e5ff"><b>[Tab]</b></span> Next  <span fg="#00e5ff"><b>[↑/↓]</b></span> Nav  <span fg="#00e5ff"><b>[a]</b></span> Add  <span fg="#00e5ff"><b>[d]</b></span> Del  <span fg="#00e5ff"><b>[P]</b></span> Apps  <span fg="#00e5ff"><b>[L]</b></span> Logs  <span fg="#00e5ff"><b>[o]</b></span> Sort  <span fg="#00e5ff"><b>[x]</b></span> Menu  <span fg="#00e5ff"><b>[q]</b></span> Quit
        </text>
      </box>

      <box flexDirection="row" alignItems="center" gap={1}>
        <text fg="#64748b">
          Active:
        </text>
        <text>
          <span bg="#1e293b" fg="#38bdf8">
            <b> {`[${activePanel}] ${PANEL_NAMES[activePanel] || ""}`} </b>
          </span>
        </text>
      </box>
    </box>
  );
};

export default Footer;
