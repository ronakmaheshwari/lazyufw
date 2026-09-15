import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import ModalBase from "./Modal";

export interface AppProfileItem {
  name: string;
  title: string;
  description: string;
  ports: string;
  protocol: "tcp" | "udp" | "any";
}

export const KNOWN_PROFILES: AppProfileItem[] = [
  {
    name: "OpenSSH",
    title: "Secure Shell Server",
    description: "Standard secure remote terminal and file transfer access.",
    ports: "22/tcp",
    protocol: "tcp",
  },
  {
    name: "Nginx Full",
    title: "Nginx Web Server (HTTP + HTTPS)",
    description: "Accepts incoming connections on standard web ports 80 and 443.",
    ports: "80,443/tcp",
    protocol: "tcp",
  },
  {
    name: "Nginx HTTP",
    title: "Nginx Web Server (HTTP only)",
    description: "Accepts plain HTTP traffic on port 80.",
    ports: "80/tcp",
    protocol: "tcp",
  },
  {
    name: "Nginx HTTPS",
    title: "Nginx Web Server (HTTPS only)",
    description: "Accepts secure encrypted SSL/TLS web traffic on port 443.",
    ports: "443/tcp",
    protocol: "tcp",
  },
  {
    name: "Apache Full",
    title: "Apache HTTP Server (HTTP + HTTPS)",
    description: "Standard Apache web server handling HTTP (80) and HTTPS (443).",
    ports: "80,443/tcp",
    protocol: "tcp",
  },
  {
    name: "Apache Secure",
    title: "Apache HTTP Server (HTTPS only)",
    description: "Accepts secure encrypted SSL/TLS traffic on port 443.",
    ports: "443/tcp",
    protocol: "tcp",
  },
  {
    name: "CUPS",
    title: "Common UNIX Printing System",
    description: "Network printing protocol service across local subnet.",
    ports: "631/tcp,udp",
    protocol: "any",
  },
  {
    name: "Samba",
    title: "Windows File & Print Sharing",
    description: "SMB/CIFS file server interoperability with Windows machines.",
    ports: "137,138/udp 139,445/tcp",
    protocol: "any",
  },
  {
    name: "MySQL",
    title: "MySQL Database Server",
    description: "Relational database network socket. Restrict to internal CIDR.",
    ports: "3306/tcp",
    protocol: "tcp",
  },
  {
    name: "PostgreSQL",
    title: "PostgreSQL Database Server",
    description: "High performance SQL database service.",
    ports: "5432/tcp",
    protocol: "tcp",
  },
  {
    name: "Redis",
    title: "Redis In-Memory Key-Value Store",
    description: "Cache and message broker service.",
    ports: "6379/tcp",
    protocol: "tcp",
  },
  {
    name: "Plex Media Server",
    title: "Plex Media Streaming Server",
    description: "Home media streaming server daemon.",
    ports: "32400/tcp",
    protocol: "tcp",
  },
];

const ACTIONS = ["ALLOW", "DENY", "REJECT", "LIMIT"] as const;
type RuleAction = typeof ACTIONS[number];

const ACTION_COLORS: Record<RuleAction, { fg: string; bg: string }> = {
  ALLOW: { fg: "#4ade80", bg: "#143823" },
  DENY: { fg: "#f87171", bg: "#3b171c" },
  REJECT: { fg: "#fb923c", bg: "#3d2814" },
  LIMIT: { fg: "#c084fc", bg: "#2d1c3d" },
};

export interface AppProfilesModalProps {
  onApply: (profile: AppProfileItem, action: RuleAction) => void;
  onCancel: () => void;
}

const AppProfilesModal = ({ onApply, onCancel }: AppProfilesModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [actionIdx, setActionIdx] = useState(0);
  // Focus areas: 0 = Search input, 1 = Profiles list, 2 = Action toggle, 3 = Apply button
  const [focusArea, setFocusArea] = useState<0 | 1 | 2 | 3>(1);

  const filtered = KNOWN_PROFILES.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ports.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeProfile = filtered[Math.min(selectedIdx, Math.max(0, filtered.length - 1))];
  const activeAction = ACTIONS[actionIdx]!;

  useKeyboard((e) => {
    if (e.name === "escape") {
      onCancel();
      return;
    }

    if (e.name === "tab") {
      if (e.shift) {
        setFocusArea((prev) => (prev === 0 ? 3 : ((prev - 1) as 0 | 1 | 2 | 3)));
      } else {
        setFocusArea((prev) => (prev === 3 ? 0 : ((prev + 1) as 0 | 1 | 2 | 3)));
      }
      return;
    }

    if (e.name === "S-tab") {
      setFocusArea((prev) => (prev === 0 ? 3 : ((prev - 1) as 0 | 1 | 2 | 3)));
      return;
    }

    // List navigation (focusArea === 1)
    if (focusArea === 1) {
      if (e.name === "up" || e.name === "k") {
        setSelectedIdx((prev) => Math.max(0, prev - 1));
        return;
      }
      if (e.name === "down" || e.name === "j") {
        setSelectedIdx((prev) => Math.min(filtered.length - 1, prev + 1));
        return;
      }
    }

    // Action toggle navigation (focusArea === 2)
    if (focusArea === 2) {
      if (e.name === "left") {
        setActionIdx((prev) => (prev === 0 ? ACTIONS.length - 1 : prev - 1));
        return;
      }
      if (e.name === "right" || e.name === "space") {
        setActionIdx((prev) => (prev + 1) % ACTIONS.length);
        return;
      }
    }

    // Enter handles apply
    if (e.name === "enter" || (focusArea === 3 && e.name === "space")) {
      if (activeProfile) {
        onApply(activeProfile, activeAction);
      }
    }
  });

  return (
    <ModalBase title="Application Profiles [P]" width={72}>
      <box flexDirection="column" gap={1} width="100%">
        {/* Search Bar */}
        <box
          flexDirection="row"
          alignItems="center"
          gap={1}
          height={3}
          paddingLeft={1}
          paddingRight={1}
          border
          borderStyle="rounded"
          borderColor={focusArea === 0 ? "#00e5ff" : "#2a324b"}
          backgroundColor="#14141e"
        >
          <text fg={focusArea === 0 ? "#00e5ff" : "#7982a9"}>
            <b>🔍 Search:</b>
          </text>
          <input
            focused={focusArea === 0}
            value={searchQuery}
            onInput={(val) => {
              setSearchQuery(val);
              setSelectedIdx(0);
            }}
            placeholder="Type to filter profiles (e.g. nginx, ssh, database)..."
          />
        </box>

        {/* Dual Columns: Profiles List + Detail Card */}
        <box flexDirection="row" width="100%" gap={1}>
          {/* Left Column: Profile List */}
          <box
            flexDirection="column"
            width={28}
            height={10}
            border
            borderStyle="rounded"
            borderColor={focusArea === 1 ? "#00e5ff" : "#2a324b"}
            backgroundColor="#14141e"
            padding={1}
          >
            {filtered.length === 0 ? (
              <text fg="#64748b">No matching profiles.</text>
            ) : (
              filtered.slice(0, 8).map((p, idx) => {
                const isSelected = idx === selectedIdx;
                return (
                  <box
                    key={p.name}
                    flexDirection="row"
                    alignItems="center"
                    backgroundColor={isSelected ? "#1e293b" : undefined}
                  >
                    <text fg={isSelected ? "#00e5ff" : "#94a3b8"}>
                      {isSelected ? "❯ " : "  "}
                      <span fg={isSelected ? "#ffffff" : "#cbd5e1"}>
                        <b>{p.name}</b>
                      </span>
                    </text>
                  </box>
                );
              })
            )}
          </box>

          {/* Right Column: Profile Detail */}
          <box
            flexDirection="column"
            flexGrow={1}
            height={10}
            border
            borderStyle="rounded"
            borderColor="#2a324b"
            backgroundColor="#14141e"
            padding={1}
            gap={0}
          >
            {activeProfile ? (
              <>
                <box flexDirection="row" alignItems="center" gap={1}>
                  <text fg="#38bdf8">
                    <b>{activeProfile.name}</b>
                  </text>
                  <text fg="#64748b">— {activeProfile.title}</text>
                </box>

                <box marginTop={1}>
                  <text fg="#cbd5e1">{activeProfile.description}</text>
                </box>

                <box flexDirection="row" alignItems="center" marginTop={1} gap={1}>
                  <text fg="#7982a9">Ports:</text>
                  <text fg="#4ade80">
                    <b>{activeProfile.ports}</b>
                  </text>
                </box>

                <box marginTop={1}>
                  <text fg="#64748b">CLI Command:</text>
                  <text fg="#38bdf8">{`$ sudo ufw ${activeAction.toLowerCase()} "${activeProfile.name}"`}</text>
                </box>
              </>
            ) : (
              <text fg="#64748b">Select a profile to view details.</text>
            )}
          </box>
        </box>

        {/* Action Selector + Apply Button */}
        <box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          marginTop={1}
        >
          {/* Action Row */}
          <box flexDirection="row" alignItems="center" gap={1}>
            <text fg={focusArea === 2 ? "#00e5ff" : "#7982a9"}>
              <b>{focusArea === 2 ? "▶ Action:" : "  Action:"}</b>
            </text>

            <box flexDirection="row" gap={1}>
              {ACTIONS.map((act, i) => {
                const isSelected = i === actionIdx;
                const col = ACTION_COLORS[act];
                return (
                  <text key={act}>
                    {isSelected ? (
                      <span bg={col.bg} fg={col.fg}>
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

          {/* Apply Button */}
          <box
            height={3}
            width={16}
            justifyContent="center"
            alignItems="center"
            border
            borderStyle="rounded"
            borderColor={focusArea === 3 ? "#4ade80" : "#2a324b"}
            backgroundColor={focusArea === 3 ? "#143823" : "#14141e"}
          >
            <text fg={focusArea === 3 ? "#86efac" : "#4ade80"}>
              <b>{focusArea === 3 ? "▶ [ Apply ]" : "  [ Apply ]"}</b>
            </text>
          </box>
        </box>

        {/* Footer Hint */}
        <box flexDirection="row" justifyContent="center" marginTop={1}>
          <text fg="#64748b">
            [<span fg="#00e5ff">Tab</span>] Section  [<span fg="#00e5ff">↑/↓</span>] Profiles  [<span fg="#00e5ff">←/→</span>] Action  [<span fg="#00e5ff">Enter</span>] Apply  [<span fg="#00e5ff">Esc</span>] Cancel
          </text>
        </box>
      </box>
    </ModalBase>
  );
};

export default AppProfilesModal;

