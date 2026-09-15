import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import ModalBase from "./Modal";

export type SortMode = "id" | "action" | "to" | "from" | "protocol";

export interface SortOption {
  id: SortMode;
  label: string;
  description: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { id: "id", label: "Rule ID (#)", description: "Standard sequential order matching UFW rule indices" },
  { id: "action", label: "Action (ALLOW / DENY)", description: "Groups rules by ALLOW, DENY, REJECT, and LIMIT" },
  { id: "to", label: "Target / Port", description: "Sorts rules by destination port and service" },
  { id: "from", label: "Source (From IP)", description: "Groups rules by source IP address or CIDR subnet" },
  { id: "protocol", label: "Protocol", description: "Sorts rules by protocol type (TCP, UDP, ANY)" },
];

export interface SortModalProps {
  currentSort: SortMode;
  onSelect: (mode: SortMode) => void;
  onCancel: () => void;
}

const SortModal = ({ currentSort, onSelect, onCancel }: SortModalProps) => {
  const initialIdx = Math.max(
    0,
    SORT_OPTIONS.findIndex((o) => o.id === currentSort)
  );
  const [selectedIdx, setSelectedIdx] = useState(initialIdx);

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
      setSelectedIdx((prev) => Math.min(SORT_OPTIONS.length - 1, prev + 1));
      return;
    }

    if (e.name === "enter" || e.name === "space") {
      const opt = SORT_OPTIONS[selectedIdx];
      if (opt) onSelect(opt.id);
      return;
    }

    // Number keys 1-5
    const num = parseInt(e.name, 10);
    if (!isNaN(num) && num >= 1 && num <= SORT_OPTIONS.length) {
      const opt = SORT_OPTIONS[num - 1];
      if (opt) onSelect(opt.id);
    }
  });

  return (
    <ModalBase title="Sort Rules [o]" width={60}>
      <box flexDirection="column" gap={1} width="100%">
        <text fg="#94a3b8">
          Choose a criteria to organize your firewall rules list:
        </text>

        {/* Options List */}
        <box
          flexDirection="column"
          padding={1}
          border
          borderStyle="rounded"
          borderColor="#2a324b"
          backgroundColor="#14141e"
          gap={0}
        >
          {SORT_OPTIONS.map((opt, idx) => {
            const isHovered = idx === selectedIdx;
            const isCurrent = opt.id === currentSort;

            return (
              <box
                key={opt.id}
                flexDirection="row"
                alignItems="center"
                height={2}
                backgroundColor={isHovered ? "#1e293b" : undefined}
                paddingLeft={1}
                paddingRight={1}
              >
                <box width={4}>
                  <text fg={isCurrent ? "#4ade80" : "#64748b"}>
                    <b>{isCurrent ? "● " : "○ "}</b>
                  </text>
                </box>

                <box width={20}>
                  <text fg={isHovered ? "#00e5ff" : isCurrent ? "#ffffff" : "#cbd5e1"}>
                    <b>{`${idx + 1}. ${opt.label}`}</b>
                  </text>
                </box>

                <box flexGrow={1}>
                  <text fg={isHovered ? "#93c5fd" : "#64748b"}>
                    {opt.description}
                  </text>
                </box>
              </box>
            );
          })}
        </box>

        {/* Footer Hint */}
        <box flexDirection="row" justifyContent="center" marginTop={1}>
          <text fg="#64748b">
            [<span fg="#00e5ff">↑/↓</span>] Choose   [<span fg="#00e5ff">Enter / 1-5</span>] Apply   [<span fg="#00e5ff">Esc</span>] Cancel
          </text>
        </box>
      </box>
    </ModalBase>
  );
};

export default SortModal;

