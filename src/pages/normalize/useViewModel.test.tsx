import { createRoot } from "solid-js";
import useViewModel from "./useViewModel";
import comparer from "@al/services/comparer";
import LogData from "@al/models/logData";
import { Pages } from "../usePage";

describe("useViewModel", () => {
  test("initial values", () => {
    createRoot((dispose) => {
      const vm = useViewModel();

      expect(vm.analyzeDisabled(), "analyzeDisabled").toEqual(true);
      expect(vm.processingFile(), "processingFile").toEqual(false);
      expect(vm.logDatas(), "logDatas").toBeTruthy();
      expect(vm.logDatas().length, "logDatas().length").toEqual(0);
      expect(vm.newFileDisabled(), "newFileDisabled").toEqual(false);

      dispose();
    });
  });

  test(`handleAnalyzeClick sets page to ${Pages.analyze}`, () => {
    createRoot((dispose) => {
      const setPage = vi.fn();

      useViewModel().handleAnalyzeClick(setPage);

      expect(setPage, "setPage").toHaveBeenCalledWith(Pages.analyze);

      dispose();
    });
  });

  describe("handleFileUpload", () => {
    const { dispose, vm } = createRoot((dispose) => {
      const vm = useViewModel();
      return { dispose, vm };
    });
    test("1 file uploaded", async () => {
      const files: any = ["my-file"];
      const logData = new LogData();
      const spyInit = vi.spyOn(logData, "init").mockResolvedValue();
      const spyAddLogData = vi.spyOn(comparer, "addLogData");

      await vm.handleFileUpload(files, logData);

      expect(vm.analyzeDisabled(), "analyzeDisabled").toEqual(false);
      expect(vm.processingFile(), "processingFile").toEqual(false);
      expect(vm.newFileDisabled(), "newFileDisabled").toEqual(false);
      expect(vm.logDatas(), "logDatas").toBeTruthy();
      expect(vm.logDatas().length, "logDatas().length").toEqual(1);
      expect(spyInit, "spyInit").toHaveBeenCalledWith(files[0]);
      expect(spyAddLogData, "spyAddLogData").toHaveBeenCalledWith(logData);
    });

    test("2 files uploaded", async () => {
      const files: any = ["another-file"];
      const logData = new LogData();
      const spyInit = vi.spyOn(logData, "init").mockResolvedValue();
      const spyAddLogData = vi.spyOn(comparer, "addLogData");

      await vm.handleFileUpload(files, logData);

      expect(vm.analyzeDisabled(), "analyzeDisabled").toEqual(false);
      expect(vm.processingFile(), "processingFile").toEqual(false);
      expect(vm.newFileDisabled(), "newFileDisabled").toEqual(true);
      expect(vm.logDatas(), "logDatas").toBeTruthy();
      expect(vm.logDatas().length, "logDatas.length").toEqual(2);
      expect(spyInit, "spyInit").toHaveBeenCalledWith(files[0]);
      expect(spyAddLogData, "spyAddLogData").toHaveBeenCalledWith(logData);
    });
    dispose();
  });
});
