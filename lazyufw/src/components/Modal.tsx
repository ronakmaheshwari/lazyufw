import type React from "react";

interface ModalBaseProps {
  title: string;
  children: React.ReactNode;
  borderColor?: string;
  titleColor?: string;
  width?: number | "auto" | `${number}%`;
}

const ModalBase = ({
  title,
  children,
  borderColor = "#01afc6",
  titleColor = "#00e5ff",
  width = 62,
}: ModalBaseProps) => {
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
        width={width}
        backgroundColor="#16161e"
        border
        borderStyle="rounded"
        borderColor={borderColor}
        title={` ${title} `}
        titleColor={titleColor}
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