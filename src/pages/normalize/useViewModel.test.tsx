import { createRoot } from "solid-js";
import useViewModel from "./useViewModel";
import comparer from "@al/services/comparer";
import LogData from "@al/models/logData";
import { Pages } from "../usePage";
import normalizer from "@al/services/normalizer";

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

    const testCases = [
      { files: ["file-1"], newFileDisabled: false, filesLen: 1 },
      { files: ["file-2"], newFileDisabled: true, filesLen: 2 },
    ];

    test.each(testCases)(
      "$filesLen file uploaded",
      async ({ files, newFileDisabled, filesLen }) => {
        const logData = new LogData();
        const spyInit = vi.spyOn(normalizer, "init").mockResolvedValue();
        const spyAddLogData = vi.spyOn(comparer, "addLogData");

        await vm.handleFileUpload(files as any, logData);

        expect(vm.analyzeDisabled(), "analyzeDisabled").toEqual(false);
        expect(vm.processingFile(), "processingFile").toEqual(false);
        expect(vm.newFileDisabled(), "newFileDisabled").toEqual(
          newFileDisabled
        );
        expect(vm.logDatas(), "logDatas").toBeTruthy();
        expect(vm.logDatas().length, "logDatas().length").toEqual(filesLen);
        expect(spyInit, "spyInit").toHaveBeenCalledWith(logData, files[0]);
        expect(spyAddLogData, "spyAddLogData").toHaveBeenCalledWith(logData);
      }
    );

    dispose();
  });
});
