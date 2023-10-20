import { createRoot } from "solid-js";
import useViewModel from "./useViewModel";
import { Pages } from "../hooks/usePage";
import comparer from "../models/comparer";
import Processor from "../models/processor";

describe("useViewModel", () => {
  test("initial values", () => {
    createRoot((dispose) => {
      const vm = useViewModel();

      expect(vm.analyzeDisabled(), "analyzeDisabled").toEqual(true);
      expect(vm.processingFile(), "processingFile").toEqual(false);
      expect(vm.processors(), "processors").toBeTruthy();
      expect(vm.processors().length, "processors().length").toEqual(0);
      expect(vm.newFileDisabled(), "newFileDisabled").toEqual(false);

      dispose();
    });
  });

  test(`handleAnalyzeClick sets page to ${Pages.analyzer}`, () => {
    createRoot((dispose) => {
      const setPage = vi.fn();

      useViewModel().handleAnalyzeClick(setPage);

      expect(setPage, "setPage").toHaveBeenCalledWith(Pages.analyzer);

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
      const processor = new Processor();
      const spyInit = vi.spyOn(processor, "init").mockResolvedValue();
      const spyAddProcessor = vi.spyOn(comparer, "addProcessor");

      await vm.handleFileUpload(files, processor);

      expect(vm.analyzeDisabled(), "analyzeDisabled").toEqual(false);
      expect(vm.processingFile(), "processingFile").toEqual(false);
      expect(vm.newFileDisabled(), "newFileDisabled").toEqual(false);
      expect(vm.processors(), "processors").toBeTruthy();
      expect(vm.processors().length, "processors().length").toEqual(1);
      expect(spyInit, "spyInit").toHaveBeenCalledWith(files[0]);
      expect(spyAddProcessor, "spyAddProcessor").toHaveBeenCalledWith(
        processor
      );
    });

    test("2 files uploaded", async () => {
      const files: any = ["another-file"];
      const processor = new Processor();
      const spyInit = vi.spyOn(processor, "init").mockResolvedValue();
      const spyAddProcessor = vi.spyOn(comparer, "addProcessor");

      await vm.handleFileUpload(files, processor);

      expect(vm.analyzeDisabled(), "analyzeDisabled").toEqual(false);
      expect(vm.processingFile(), "processingFile").toEqual(false);
      expect(vm.newFileDisabled(), "newFileDisabled").toEqual(true);
      expect(vm.processors(), "processors").toBeTruthy();
      expect(vm.processors().length, "processors.length").toEqual(2);
      expect(spyInit, "spyInit").toHaveBeenCalledWith(files[0]);
      expect(spyAddProcessor, "spyAddProcessor").toHaveBeenCalledWith(
        processor
      );
    });
    dispose();
  });
});
