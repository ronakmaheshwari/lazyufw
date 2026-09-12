import type React from "react";

interface ModalBaseProps {
  title: string;
  children: React.ReactNode;
}

const ModalBase = ({ title, children }: ModalBaseProps) => {
  return (
    <box
      position="absolute"
      top={0}
      left={0}
      width="100%"
      height="100%"
      alignItems="center"
      justifyContent="center"
      zIndex={100}
    >
      <box
        width={62}
        backgroundColor="#16161e"
        border
        borderStyle="rounded"
        borderColor="#01afc6"
        title={` ${title} `}
        titleColor="#00e5ff"
        padding={1}
        paddingLeft={2}
        paddingRight={2}
        flexDirection="column"
      >
        {children}
      </box>
    </box>
  );
};

export default ModalBase;