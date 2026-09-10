import type { RuleCellProp } from "../components/RuleCell";
import RuleCell from "../components/RuleCell";

export interface RulesPanelProps {
  rules: RuleCellProp[];
  active?: boolean;
  selectedIndex?: number;
}

const RulesPanel = ({
  rules,
  active = true,
  selectedIndex = 0,
}: RulesPanelProps) => {
  if (!active) {
    return (
      <box
        flexDirection="row"
        alignItems="center"
        width="100%"
        height={3}
        paddingLeft={2}
        paddingRight={2}
        border
        borderStyle="rounded"
        borderColor="#2a324b"
        title=" [2] Rules "
        titleColor="#64748b"
      >
        <text>
          <span fg="#7982a9">Rules: </span>
          <b fg="#f1f5f9">{rules.length}</b>
          <span fg="#64748b"> configured</span>
        </text>
      </box>
    );
  }

  return (
    <box
      flexDirection="column"
      width="100%"
      flexGrow={1}
      padding={1}
      border
      borderStyle="rounded"
      borderColor="#01afc6"
      title=" [2] Rules "
      titleColor="#00e5ff"
    >
      {/* Table Column Headers */}
      <box flexDirection="row" alignItems="center" height={1} marginBottom={1}>
        <box width={6}>
          <text fg="#64748b">  #</text>
        </box>
        <box width={4}>
          <text fg="#64748b">DIR</text>
        </box>
        <box width={14}>
          <text fg="#64748b">TARGET</text>
        </box>
        <box width={11}>
          <text fg="#64748b">ACTION</text>
        </box>
        <box width={16}>
          <text fg="#64748b">FROM</text>
        </box>
        <box flexGrow={1}>
          <text fg="#64748b">COMMENT</text>
        </box>
      </box>

      {/* Rules List */}
      <box flexDirection="column" gap={0} flexGrow={1}>
        {rules.length === 0 ? (
          <text fg="#64748b">No firewall rules found. Press 'a' to add one.</text>
        ) : (
          rules.map((r, i) => (
            <RuleCell
              key={r.id}
              {...r}
              selected={i === selectedIndex}
            />
          ))
        )}
      </box>
    </box>
  );
};

export default RulesPanel;

