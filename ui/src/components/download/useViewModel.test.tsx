import filesUtils from "@al/utils/files";
import { createRoot } from "solid-js";
import useViewModel from "./useViewModel";
import LogData from "@al/models/logData";

test("downloadSubset", () => {
  createRoot((dispose) => {
    const spyDownloadNewFile = vi
      .spyOn(filesUtils, "downloadNewFile")
      .mockImplementation(() => {});

    const props = {
      logs: () => [
        { [LogData.logKeys.fullData]: "log 1" },
        { [LogData.logKeys.fullData]: "log 2" },
      ],
    };
    const vm = useViewModel(props as any);
    vm.downloadSubset();

    expect(spyDownloadNewFile, "spyDownloadNewFile").toHaveBeenCalledWith(
      "filtered-logs.log",
      ["log 1", "log 2"]
    );

    dispose();
  });
});
