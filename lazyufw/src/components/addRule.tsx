import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import ModalBase from "./Modal";

type RuleAction = "ALLOW" | "DENY" | "REJECT" | "LIMIT";
type RuleProtocol = "ANY" | "TCP" | "UDP";

const ACTIONS: readonly RuleAction[] = ["ALLOW", "DENY", "REJECT", "LIMIT"];
const PROTOCOLS: readonly RuleProtocol[] = ["ANY", "TCP", "UDP"];

export interface AddRuleFormData {
  action: RuleAction;
  protocol: RuleProtocol;
  port: string;
  from: string;
  comment: string;
}

interface AddRuleModalProps {
  onSubmit: (data: AddRuleFormData) => void;
  onCancel: () => void;
}

const ACTION_COLORS: Record<RuleAction, { fg: string; bg: string }> = {
  ALLOW: { fg: "#4ade80", bg: "#143823" },
  DENY: { fg: "#f87171", bg: "#3b171c" },
  REJECT: { fg: "#fb923c", bg: "#3d2814" },
  LIMIT: { fg: "#c084fc", bg: "#2d1c3d" },
};

const IP_OR_CIDR_RE = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;

const AddRuleModal = ({ onSubmit, onCancel }: AddRuleModalProps) => {
  const [actionIndex, setActionIndex] = useState(0);
  const [protocolIndex, setProtocolIndex] = useState(1);
  const [port, setPort] = useState("");
  const [from, setFrom] = useState("");
  const [comment, setComment] = useState("");
  const [focusIndex, setFocusIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmedPort = port.trim();
    if (!trimmedPort) {
      setError("Port is required (e.g. 22 or 8000:8100)");
      setFocusIndex(2);
      return;
    }
    if (!/^\d{1,5}(:\d{1,5})?$/.test(trimmedPort)) {
      setError("Port must be a number or a range like 8000:8100");
      setFocusIndex(2);
      return;
    }

    const trimmedFrom = from.trim();
    if (
      trimmedFrom &&
      !IP_OR_CIDR_RE.test(trimmedFrom) &&
      trimmedFrom.toLowerCase() !== "any" &&
      trimmedFrom.toLowerCase() !== "anywhere"
    ) {
      setError("From must be a valid IP/CIDR (e.g. 192.168.1.0/24) or empty.");
      setFocusIndex(3);
      return;
    }

    setError(null);
    onSubmit({
      action: ACTIONS[actionIndex]!,
      protocol: PROTOCOLS[protocolIndex]!,
      port: trimmedPort,
      from: trimmedFrom || "Anywhere",
      comment: comment.trim(),
    });
  };

  useKeyboard((e) => {
    if (e.name === "escape") {
      onCancel();
      return;
    }

    if (e.name === "tab") {
      if (e.shift) {
        setFocusIndex((prev) => (prev === 0 ? 5 : prev - 1));
      } else {
        setFocusIndex((prev) => (prev === 5 ? 0 : prev + 1));
      }
      return;
    }

    if (e.name === "S-tab") {
      setFocusIndex((prev) => (prev === 0 ? 5 : prev - 1));
      return;
    }

    if (focusIndex === 0) {
      if (e.name === "left") {
        setActionIndex((prev) => (prev === 0 ? ACTIONS.length - 1 : prev - 1));
      } else if (e.name === "right" || e.name === "space") {
        setActionIndex((prev) => (prev + 1) % ACTIONS.length);
      }
    }

    if (focusIndex === 1) {
      if (e.name === "left") {
        setProtocolIndex((prev) =>
          prev === 0 ? PROTOCOLS.length - 1 : prev - 1,
        );
      } else if (e.name === "right" || e.name === "space") {
        setProtocolIndex((prev) => (prev + 1) % PROTOCOLS.length);
      }
    }

    if (e.name === "enter" || (focusIndex === 5 && e.name === "space")) {
      handleSubmit();
    }
  });

  const activeAction = ACTIONS[actionIndex]!;
  const activeProtocol = PROTOCOLS[protocolIndex]!;

  return (
    <ModalBase title="Add Firewall Rule [a]">
      <box flexDirection="column" gap={1} width="100%">
        <text fg="#94a3b8">
          Configure a new allow, deny, reject, or limit rule.
        </text>

        <box flexDirection="row" alignItems="center">
          <box width={14}>
            <text fg={focusIndex === 0 ? "#00e5ff" : "#7982a9"}>
              <b>{focusIndex === 0 ? "▶ Action:" : "  Action:"}</b>
            </text>
          </box>

          <box flexDirection="row" gap={1} alignItems="center">
            {ACTIONS.map((act, i) => {
              const isSelected = i === actionIndex;
              const color = ACTION_COLORS[act];
              return (
                <text key={act}>
                  {isSelected ? (
                    <span bg={color.bg} fg={color.fg}>
                      <b>{` ${act} `}</b>
                    </span>
                  ) : (
                    <span fg="#64748b">{` ${act} `}</span>
                  )}
                </text>
              );
            })}
          </box>
        </box>

        <box flexDirection="row" alignItems="center">
          <box width={14}>
            <text fg={focusIndex === 1 ? "#00e5ff" : "#7982a9"}>
              <b>{focusIndex === 1 ? "▶ Protocol:" : "  Protocol:"}</b>
            </text>
          </box>

          <box flexDirection="row" gap={1} alignItems="center">
            {PROTOCOLS.map((proto, i) => {
              const isSelected = i === protocolIndex;
              return (
                <text key={proto}>
                  {isSelected ? (
                    <span bg="#1e293b" fg="#38bdf8">
                      <b>{` ${proto} `}</b>
                    </span>
                  ) : (
                    <span fg="#64748b">{` ${proto} `}</span>
                  )}
                </text>
              );
            })}
          </box>
        </box>

        <box flexDirection="row" alignItems="center">
          <box width={14}>
            <text fg={focusIndex === 2 ? "#00e5ff" : "#7982a9"}>
              <b>{focusIndex === 2 ? "▶ Port:" : "  Port:"}</b>
            </text>
          </box>

          <box
            flexGrow={1}
            height={3}
            paddingLeft={1}
            paddingRight={1}
            border
            borderStyle="rounded"
            borderColor={focusIndex === 2 ? "#00e5ff" : "#2a324b"}
            justifyContent="center"
          >
            <input
              focused={focusIndex === 2}
              value={port}
              onInput={(val) => {
                setPort(val);
                if (error) setError(null);
              }}
              onSubmit={handleSubmit}
              placeholder="e.g. 22 or 8000:8100"
            />
          </box>
        </box>

        <box flexDirection="row" alignItems="center">
          <box width={14}>
            <text fg={focusIndex === 3 ? "#00e5ff" : "#7982a9"}>
              <b>{focusIndex === 3 ? "▶ From:" : "  From:"}</b>
            </text>
          </box>

          <box
            flexGrow={1}
            height={3}
            paddingLeft={1}
            paddingRight={1}
            border
            borderStyle="rounded"
            borderColor={focusIndex === 3 ? "#00e5ff" : "#2a324b"}
            justifyContent="center"
          >
            <input
              focused={focusIndex === 3}
              value={from}
              onInput={(val) => setFrom(val)}
              onSubmit={handleSubmit}
              placeholder="Anywhere (or 192.168.1.0/24)"
            />
          </box>
        </box>

        <box flexDirection="row" alignItems="center">
          <box width={14}>
            <text fg={focusIndex === 4 ? "#00e5ff" : "#7982a9"}>
              <b>{focusIndex === 4 ? "▶ Comment:" : "  Comment:"}</b>
            </text>
          </box>

          <box
            flexGrow={1}
            height={3}
            paddingLeft={1}
            paddingRight={1}
            border
            borderStyle="rounded"
            borderColor={focusIndex === 4 ? "#00e5ff" : "#2a324b"}
            justifyContent="center"
          >
            <input
              focused={focusIndex === 4}
              value={comment}
              onInput={(val) => setComment(val)}
              onSubmit={handleSubmit}
              placeholder="Optional comment"
            />
          </box>
        </box>

        {error && (
          <box height={1}>
            <text fg="#ef4444">
              <b>{`✗ ${error}`}</b>
            </text>
          </box>
        )}

        <box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          marginTop={1}
        >
          <text fg="#64748b">
            [<span fg="#00e5ff">Tab</span>] Next [<span fg="#00e5ff">←/→</span>]
            Choice [<span fg="#00e5ff">Esc</span>] Cancel
          </text>

          <box flexDirection="row" gap={2} alignItems="center">
            <text>
              {focusIndex === 5 ? (
                <span bg="#143823" fg="#4ade80">
                  <b>[ Submit Rule ]</b>
                </span>
              ) : (
                <span fg="#4ade80">[ Submit Rule ]</span>
              )}
            </text>
          </box>
        </box>
      </box>
    </ModalBase>
  );
};

export default AddRuleModal;