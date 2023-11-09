import LogData, { JSONLogs } from "@al/models/logData";
import filesUtils from "@al/utils/files";
import { Accessor } from "solid-js";

interface Props {
  logs: Accessor<JSONLogs>;
}

function useViewModel(props: Props) {
  function downloadSubset() {
    filesUtils.downloadNewFile(
      "filtered-logs.log",
      props.logs().map((m) => m[LogData.logKeys.fullData])
    );
  }

  return {
    downloadSubset,
  };
}

export default useViewModel;
export type { Props };
