import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";

import Header from "./components/Header";
import StatusPanel from "./screens/StatusPanel";

function App() {
  return (
    <box
      flexGrow={1}
      flexDirection="column"
      padding={1}
    >
      <Header
        title="Lazy UFW"
        status="ACTIVE"
        log={false}
        logState="Low"
        rulesCount={12}
      />

      <StatusPanel
        state="ACTIVE"
        log={false}
        logState="Low"
        ruleCount={12}
        auth="ENABLED"
        policy={{
          in: false,
          out: true,
          route: false,
        }}
      />
    </box>
  );
}

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  backgroundColor: "#0f0f13",
});

createRoot(renderer).render(<App />);