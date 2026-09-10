export interface FooterProps {
  activePanel: number;
}

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
      borderColor="#2a324b"
    >
      <text fg="#94a3b8">
        <span fg="#00e5ff"><b>[1-4]</b></span> Panels  <span fg="#00e5ff"><b>[Tab]</b></span> Next  <span fg="#00e5ff"><b>[↑/↓]</b></span> Select  <span fg="#00e5ff"><b>[a]</b></span> Add  <span fg="#00e5ff"><b>[d]</b></span> Del  <span fg="#00e5ff"><b>[e]</b></span> Enable  <span fg="#00e5ff"><b>[D]</b></span> Disable  <span fg="#00e5ff"><b>[q]</b></span> Quit
      </text>

      <text fg="#64748b">
        Active Panel: <span fg="#00e5ff"><b>[{activePanel}]</b></span>
      </text>
    </box>
  );
};

export default Footer;

