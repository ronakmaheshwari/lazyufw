import type { StatusProps } from "../components/Status";
import Status from "../components/Status";

const StatusPanel = (data: StatusProps) => {
  return <Status {...data} />;
};

export default StatusPanel;