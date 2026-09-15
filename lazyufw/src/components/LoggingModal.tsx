import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import ModalBase from "./Modal";
import type { LogState } from "./Header";

export interface LogOption {
  level: LogState;
  label: string;
  description: string;
}

export const LOG_OPTIONS: LogOption[] = [
  {
    level: "Low",
    label: "Low (Recommended)",
    description: "Logs all blocked packets not matching policy and packets matching logged rules.",
  },
  {
    level: "Medium",
    label: "Medium",
    description: "Low + logs all allowed packets not matching policy, INVALID packets, and new connections.",
  },
  {
    level: "High",
    label: "High (Verbose)",
    description: "Medium + rate-limiting logs. Useful for debugging; generates significant disk I/O.",
  },
  {
    level: "Off",
    label: "Off (Disable)",
    description: "Completely disables UFW packet logging.",
  },
];

export interface LoggingModalProps {
  currentLevel: LogState;
  onSelect: (level: LogState) => void;
  onCancel: () => void;
}

const LoggingModal = ({ currentLevel, onSelect, onCancel }: LoggingModalProps) => {
  const initialIdx = Math.max(
    0,
    LOG_OPTIONS.findIndex((o) => o.level.toLowerCase() === currentLevel.toLowerCase())
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
      setSelectedIdx((prev) => Math.min(LOG_OPTIONS.length - 1, prev + 1));
      return;
    }

    if (e.name === "enter" || e.name === "space") {
      const opt = LOG_OPTIONS[selectedIdx];
      if (opt) onSelect(opt.level);
      return;
    }

    const num = parseInt(e.name, 10);
    if (!isNaN(num) && num >= 1 && num <= LOG_OPTIONS.length) {
      const opt = LOG_OPTIONS[num - 1];
      if (opt) onSelect(opt.level);
    }
  });

  return (
    <ModalBase title="Set UFW Logging Level [L]" width={64}>
      <box flexDirection="column" gap={1} width="100%">
        <box flexDirection="row" alignItems="center" gap={1}>
          <text fg="#94a3b8">Select logging verbosity level. Current active:</text>
          <text>
            <span bg="#1e293b" fg="#38bdf8">
              <b> {currentLevel.toUpperCase()} </b>
            </span>
          </text>
        </box>

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
          {LOG_OPTIONS.map((opt, idx) => {
            const isHovered = idx === selectedIdx;
            const isCurrent = opt.level.toLowerCase() === currentLevel.toLowerCase();

            return (
              <box
                key={opt.level}
                flexDirection="column"
                height={2}
                backgroundColor={isHovered ? "#1e293b" : undefined}
                paddingLeft={1}
                paddingRight={1}
                justifyContent="center"
              >
                <box flexDirection="row" alignItems="center">
                  <box width={4}>
                    <text fg={isCurrent ? "#4ade80" : "#64748b"}>
                      <b>{isCurrent ? "● " : "○ "}</b>
                    </text>
                  </box>

                  <box width={24}>
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
              </box>
            );
          })}
        </box>

        {/* Footer Hint */}
        <box flexDirection="row" justifyContent="center" marginTop={1}>
          <text fg="#64748b">
            [<span fg="#00e5ff">↑/↓</span>] Choose   [<span fg="#00e5ff">Enter / 1-4</span>] Apply   [<span fg="#00e5ff">Esc</span>] Cancel
          </text>
        </box>
      </box>
    </ModalBase>
  );
};

export default LoggingModal;

