import ModalBase from "./Modal";

const ConfigureFirewall = ({title}:{title: string}) => {
  return (
    <ModalBase title="Disable Firewall">
      <box flexDirection="column" gap={1} width="100%">
        <text fg="#fcfcfc">
          {title}
        </text>
        <box
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          gap={10}
        >
          <box flexDirection="row" padding={1} gap={2} alignItems="center">
            <text>Yes</text>
          </box>
          <box flexDirection="row" padding={1} gap={2} alignItems="center">
            <text fg="#4ade80">No</text>
          </box>
        </box>
      </box>
    </ModalBase>
  );
};

export default ConfigureFirewall;