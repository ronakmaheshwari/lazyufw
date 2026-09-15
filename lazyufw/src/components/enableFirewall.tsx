import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import ModalBase from "./Modal";

export interface ConfigureFirewallProps {
  title?: string;
  message?: string;
  modalTitle?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  dangerous?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const ConfigureFirewall = ({
  title,
  message,
  modalTitle,
  confirmLabel,
  cancelLabel = "Cancel",
  dangerous,
  onConfirm,
  onCancel,
}: ConfigureFirewallProps) => {
  const promptText = message || title || "Are you sure you want to change the firewall state?";
  const isDisable = dangerous ?? promptText.toLowerCase().includes("disable");

  const resolvedTitle = modalTitle || (isDisable ? "⚠️  Disable Firewall" : "🛡️  Enable Firewall");
  const resolvedConfirmLabel = confirmLabel || (isDisable ? "Yes, Disable" : "Yes, Enable");
  const borderColor = isDisable ? "#ef4444" : "#22c55e";
  const titleColor = isDisable ? "#f87171" : "#4ade80";
  const [selectedIndex, setSelectedIndex] = useState<number>(isDisable ? 1 : 0);

  useKeyboard((e) => {
    if (e.name === "escape") {
      onCancel?.();
      return;
    }

    if (e.name === "tab" || e.name === "left" || e.name === "right") {
      setSelectedIndex((prev) => (prev === 0 ? 1 : 0));
      return;
    }

    if (e.name === "enter" || e.name === "space") {
      if (selectedIndex === 0) {
        onConfirm?.();
      } else {
        onCancel?.();
      }
    }
  });

  return (
    <ModalBase title={resolvedTitle} borderColor={borderColor} titleColor={titleColor} width={60}>
      <box flexDirection="column" gap={1} width="100%">
        {/* Warning / Notice Banner */}
        <box
          flexDirection="column"
          padding={1}
          paddingLeft={2}
          paddingRight={2}
          backgroundColor={isDisable ? "#251216" : "#0f2419"}
          border
          borderStyle="rounded"
          borderColor={isDisable ? "#7f1d1d" : "#14532d"}
          width="100%"
          gap={1}
        >
          <box flexDirection="row" alignItems="center" gap={1}>
            <text fg={isDisable ? "#fb923c" : "#4ade80"}>
              <b>{isDisable ? "WARNING" : "CONFIRMATION"}</b>
            </text>
          </box>

          <text fg="#f1f5f9">
            <b>{promptText}</b>
          </text>

          <text fg={isDisable ? "#fca5a5" : "#86efac"}>
            {isDisable
              ? "All active packet filtering will stop. Incoming connections will not be restricted."
              : "Firewall rules will be actively applied to incoming and outgoing network traffic."}
          </text>
        </box>

        {/* Buttons Row */}
        <box
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          gap={3}
          marginTop={1}
          width="100%"
        >
          {/* Confirm Button */}
          <box
            width={18}
            height={3}
            justifyContent="center"
            alignItems="center"
            border
            borderStyle="rounded"
            borderColor={
              selectedIndex === 0
                ? isDisable
                  ? "#ef4444"
                  : "#22c55e"
                : "#2a324b"
            }
            backgroundColor={
              selectedIndex === 0
                ? isDisable
                  ? "#451218"
                  : "#143823"
                : "#14141e"
            }
          >
            <text fg={selectedIndex === 0 ? (isDisable ? "#fca5a5" : "#86efac") : "#64748b"}>
              <b>{selectedIndex === 0 ? `▶ ${resolvedConfirmLabel}` : `  ${resolvedConfirmLabel}`}</b>
            </text>
          </box>

          {/* Cancel Button */}
          <box
            width={18}
            height={3}
            justifyContent="center"
            alignItems="center"
            border
            borderStyle="rounded"
            borderColor={selectedIndex === 1 ? "#38bdf8" : "#2a324b"}
            backgroundColor={selectedIndex === 1 ? "#1e293b" : "#14141e"}
          >
            <text fg={selectedIndex === 1 ? "#38bdf8" : "#64748b"}>
              <b>{selectedIndex === 1 ? `▶ ${cancelLabel}` : `  ${cancelLabel}`}</b>
            </text>
          </box>
        </box>

        {/* Footer Hint */}
        <box
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          marginTop={1}
          width="100%"
        >
          <text fg="#64748b">
            [<span fg="#00e5ff">Tab/←→</span>] Choose   [<span fg="#00e5ff">Enter</span>] Confirm   [<span fg="#00e5ff">Esc</span>] Cancel
          </text>
        </box>
      </box>
    </ModalBase>
  );
};

export default ConfigureFirewall;