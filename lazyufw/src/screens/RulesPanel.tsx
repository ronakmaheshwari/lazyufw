import type { RuleCellProp } from "../components/RuleCell";
import RuleCell from "../components/RuleCell";

export interface RulesPanelProps {
  rules: RuleCellProp[];
  active?: boolean;
  selectedIndex?: number;
  sortMode?: string;
  filterQuery?: string;
}

const RulesPanel = ({
  rules,
  active = true,
  selectedIndex = 0,
  sortMode = "id",
  filterQuery,
}: RulesPanelProps) => {
  const sortBadge = sortMode !== "id" ? ` [sort: ${sortMode.toUpperCase()}]` : "";
  const filterBadge = filterQuery ? ` [filter: "${filterQuery}"]` : "";
  const titleStr = ` [2] Rules (${rules.length})${sortBadge}${filterBadge} `;

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
        borderColor="#23283b"
        title=" [2] Rules "
        titleColor="#64748b"
        backgroundColor="#16161e"
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
      title={titleStr}
      titleColor="#00e5ff"
      backgroundColor="#16161e"
    >
      {/* Table Column Headers */}
      <box
        flexDirection="row"
        alignItems="center"
        height={1}
        marginBottom={1}
        paddingBottom={0}
      >
        <box width={6}>
          <text fg="#7982a9"><b>  #</b></text>
        </box>
        <box width={4}>
          <text fg="#7982a9"><b>DIR</b></text>
        </box>
        <box width={14}>
          <text fg="#7982a9"><b>TARGET</b></text>
        </box>
        <box width={11}>
          <text fg="#7982a9"><b>ACTION</b></text>
        </box>
        <box width={16}>
          <text fg="#7982a9"><b>FROM</b></text>
        </box>
        <box flexGrow={1}>
          <text fg="#7982a9"><b>COMMENT</b></text>
        </box>
      </box>

      {/* Rules List */}
      <box flexDirection="column" gap={0} flexGrow={1}>
        {rules.length === 0 ? (
          <box padding={1} flexDirection="column">
            <text fg="#64748b">
              {filterQuery
                ? `No firewall rules match "${filterQuery}". Press '/' to search again.`
                : "No firewall rules found. Press 'a' to add one or 'P' for App Profiles."}
            </text>
          </box>
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
