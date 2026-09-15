import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import ModalBase from "./Modal";

export interface ActionMenuItem {
  key: string;
  label: string;
  description: string;
  actionId: string;
}

const MENU_ITEMS: ActionMenuItem[] = [
  { key: "a", label: "Add Rule", description: "Configure custom port/protocol rule", actionId: "add_rule" },
  { key: "P", label: "App Profiles", description: "Browse and apply pre-configured app profiles", actionId: "app_profiles" },
  { key: "o", label: "Sort Rules", description: "Change rules sort order (ID, Action, Port, IP)", actionId: "sort_rules" },
  { key: "L", label: "Logging Level", description: "Set UFW logging level (Off, Low, Med, High)", actionId: "log_modal" },
  { key: "e", label: "Enable Firewall", description: "Turn on UFW firewall packet filtering", actionId: "enable_fw" },
  { key: "d", label: "Disable Firewall", description: "Turn off UFW firewall packet filtering", actionId: "disable_fw" },
  { key: "r", label: "Reset Defaults", description: "Reset mock rules to default initial set", actionId: "reset_rules" },
  { key: "q", label: "Quit lazyufw", description: "Exit the application", actionId: "quit" },
];

export interface ActionMenuModalProps {
  onSelect: (actionId: string) => void;
  onCancel: () => void;
}

const ActionMenuModal = ({ onSelect, onCancel }: ActionMenuModalProps) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  useKeyboard((e) => {
    if (e.name === "escape") {
      onCancel();
      return;
    }

    if (e.name === "up" || e.name === "k") {
      setSelectedIdx((prev) => Math.max(0, prev - 1));
      return;
    }

    if (e.name === "down" || e.name === "j") {
      setSelectedIdx((prev) => Math.min(MENU_ITEMS.length - 1, prev + 1));
      return;
    }

    if (e.name === "enter") {
      const item = MENU_ITEMS[selectedIdx];
      if (item) onSelect(item.actionId);
      return;
    }

    // Direct shortcut matching
    for (const item of MENU_ITEMS) {
      if (
        e.name.toLowerCase() === item.key.toLowerCase() ||
        (e.shift && e.name.toLowerCase() === item.key.toLowerCase())
      ) {
        onSelect(item.actionId);
        return;
      }
    }
  });

  return (
    <ModalBase title="Quick Actions Menu [x]" width={64}>
      <box flexDirection="column" gap={1} width="100%">
        <text fg="#94a3b8">
          Select an action using arrow keys or press its hotkey directly:
        </text>

        {/* Menu Items List */}
        <box
          flexDirection="column"
          padding={1}
          border
          borderStyle="rounded"
          borderColor="#2a324b"
          backgroundColor="#14141e"
          gap={0}
        >
          {MENU_ITEMS.map((item, idx) => {
            const isSelected = idx === selectedIdx;
            return (
              <box
                key={item.actionId}
                flexDirection="row"
                alignItems="center"
                height={1}
                backgroundColor={isSelected ? "#1e293b" : undefined}
                paddingLeft={1}
              >
                <box width={6}>
                  <text fg={isSelected ? "#00e5ff" : "#38bdf8"}>
                    <b>{`[${item.key}]`}</b>
                  </text>
                </box>

                <box width={18}>
                  <text fg={isSelected ? "#ffffff" : "#f1f5f9"}>
                    <b>{item.label}</b>
                  </text>
                </box>

                <box flexGrow={1}>
                  <text fg={isSelected ? "#93c5fd" : "#64748b"}>
                    {item.description}
                  </text>
                </box>
              </box>
            );
          })}
        </box>

        {/* Footer Hint */}
        <box flexDirection="row" justifyContent="center" marginTop={1}>
          <text fg="#64748b">
            [<span fg="#00e5ff">↑/↓</span>] Navigate   [<span fg="#00e5ff">Enter / Key</span>] Run   [<span fg="#00e5ff">Esc</span>] Close
          </text>
        </box>
      </box>
    </ModalBase>
  );
};

export default ActionMenuModal;

