import { createRoot } from "solid-js";
import useViewModel from "./useViewModel";
import comparer from "../models/comparer";
import Processor from "../models/processor";
import gridService from "./gridService";
import filesUtils from "../utils/files";
import timesUtils from "../utils/times";
import { FiltersData } from "../components/filters/useViewModel";

describe("useViewModel", () => {
  beforeEach(() => {
    const processor = new Processor();
    processor.logs = [
      { [Processor.logKeys.fullData]: "json string 1" },
      { [Processor.logKeys.fullData]: "json string 2" },
    ];
    vi.spyOn(comparer, "last").mockReturnValue(processor);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("initial values", () => {
    createRoot((dispose) => {
      const vm = useViewModel();

      expect(vm.timeJumps(), "timeJumps").toBeTruthy();
      expect(vm.timeJumps().nextDisabled, "timeJumps().nextDisabled").toEqual(
        true
      );
      expect(vm.timeJumps().prevDisabled, "timeJumps().prevDisabled").toEqual(
        true
      );
      expect(vm.rows(), "rows").toEqual(comparer.last().logs);
      expect(vm.initialCols(), "initialCols").toEqual(
        gridService.defaultCols()
      );
      expect(vm.dialogOpened(), "dialogOpened").toEqual(false);
      expect(vm.selectedCellData(), "selectedCellData").toEqual("");

      dispose();
    });
  });

  test("handleCellDoubleClick", () => {
    createRoot((dispose) => {
      const vm = useViewModel();
      const event = {
        value: "some data",
      };
      vm.handleCellDoubleClick(event as any);

      expect(vm.selectedCellData(), "selectedCellData").toEqual(event.value);
      expect(vm.dialogOpened(), "dialogOpened").toEqual(true);

      dispose();
    });
  });

  test("closeDialog", () => {
    createRoot((dispose) => {
      const vm = useViewModel();
      vm.closeDialog();
      expect(vm.dialogOpened(), "dialogOpened").toEqual(false);

      dispose();
    });
  });

  test("handleColsChange", () => {
    createRoot((dispose) => {
      const vm = useViewModel();
      const cols = ["col1", "col2"];
      vm.handleColsChange(cols);
      expect(vm.cols().length, "cols.length").toEqual(2);
      cols.forEach((c, i) =>
        expect(vm.cols()[i].field, `cols()[${i}]`).toEqual(c)
      );

      dispose();
    });
  });

  test("downloadSubset", () => {
    createRoot((dispose) => {
      const spyDownloadNewFile = vi
        .spyOn(filesUtils, "downloadNewFile")
        .mockImplementation(() => {});

      const vm = useViewModel();
      vm.downloadSubset();

      expect(spyDownloadNewFile, "spyDownloadNewFile").toHaveBeenCalledWith(
        "filtered-logs.log",
        [
          comparer.last().logs[0][Processor.logKeys.fullData],
          comparer.last().logs[1][Processor.logKeys.fullData],
        ]
      );

      dispose();
    });
  });

  test("handleFiltersChange", () => {
    createRoot((dispose) => {
      comparer.last().logs = [
        {
          [Processor.logKeys.id]: "10",
          [Processor.logKeys.timestamp]: "2023-10-20T08:00:00.000Z",
          [Processor.logKeys.fullData]: "msg one two three",
          [Processor.logKeys.msg]: "msg one two three",
        },
        {
          [Processor.logKeys.id]: "20",
          [Processor.logKeys.timestamp]: "2023-10-20T10:00:00.000Z",
          [Processor.logKeys.fullData]: "test one two four",
          [Processor.logKeys.msg]: "test one two four",
        },
        {
          [Processor.logKeys.id]: "30",
          [Processor.logKeys.timestamp]: "2023-10-20T12:00:00.000Z",
          [Processor.logKeys.fullData]: "msg four five six",
          [Processor.logKeys.msg]: "msg four five six",
        },
      ];

      vi.spyOn(Processor, "isErrorLog")
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      vi.spyOn(timesUtils, "diffMinutes").mockReturnValue(100);

      const filters: FiltersData = {
        startTime: "2023-10-20T01:00:00.000Z",
        endTime: "2023-10-20T11:00:00.000Z",
        errorsOnly: true,
        msgs: ["msg", "test"],
        regex: "^tes.*our$",
      };

      const vm = useViewModel();
      vm.handleFiltersChange(filters);

      expect(vm.rows(), "rows").toEqual([comparer.last().logs[1]]);
      expect(vm.timeJumps().prevDisabled, "prevDisabled").toEqual(true);
      expect(vm.timeJumps().nextDisabled, "nextDisabled").toEqual(false);

      dispose();
    });
  });

  describe("handleTimeJump", () => {
    let filters: FiltersData;
    beforeEach(() => {
      const processor = new Processor();
      processor.logs = [
        {
          [Processor.logKeys.id]: "1",
          [Processor.logKeys.timestamp]: "2023-10-20T08:00:00.000Z",
        },
        {
          [Processor.logKeys.id]: "2",
          [Processor.logKeys.timestamp]: "2023-10-20T10:00:00.000Z",
        },
        {
          [Processor.logKeys.id]: "3",
          [Processor.logKeys.timestamp]: "2023-10-20T12:00:00.000Z",
        },
        {
          [Processor.logKeys.id]: "4",
          [Processor.logKeys.timestamp]: "2023-10-20T14:00:00.000Z",
        },
        {
          [Processor.logKeys.id]: "5",
          [Processor.logKeys.timestamp]: "2023-10-20T16:00:00.000Z",
        },
      ];
      vi.spyOn(comparer, "last").mockReturnValue(processor);

      vi.spyOn(timesUtils, "diffMinutes")
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(50)
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(70)
        .mockReturnValueOnce(30);

      filters = {
        msgs: [],
      } as any;
    });

    test("handleTimeJump", () => {
      createRoot((dispose) => {
        const vm = useViewModel();
        vm.handleFiltersChange(filters);
        expect(vm.rows().length, "rows.length").toEqual(
          comparer.last().logs.length
        );

        const mockGridRef = {
          api: {
            ensureNodeVisible: vi.fn(),
            getRowNode: vi.fn().mockImplementation((x) => x),
          },
        };

        let jump = "next1 ";
        vm.handleTimeJump(mockGridRef as any, true);
        expect(
          mockGridRef.api.ensureNodeVisible,
          jump + "ensureNodeVisible"
        ).toHaveBeenNthCalledWith(1, "2", "middle");
        expect(vm.timeJumps().prevDisabled, jump + "prevDisabled").toEqual(
          false
        );
        expect(vm.timeJumps().nextDisabled, jump + "nextDisabled").toEqual(
          false
        );

        jump = "next2 ";
        vm.handleTimeJump(mockGridRef as any, true);
        expect(
          mockGridRef.api.ensureNodeVisible,
          jump + "ensureNodeVisible"
        ).toHaveBeenNthCalledWith(2, "4", "middle");
        expect(vm.timeJumps().prevDisabled, jump + "prevDisabled").toEqual(
          false
        );
        expect(vm.timeJumps().nextDisabled, jump + "nextDisabled").toEqual(
          false
        );

        jump = "next3 ";
        vm.handleTimeJump(mockGridRef as any, true);
        expect(
          mockGridRef.api.ensureNodeVisible,
          jump + "ensureNodeVisible"
        ).toHaveBeenNthCalledWith(3, "5", "middle");
        expect(vm.timeJumps().prevDisabled, jump + "prevDisabled").toEqual(
          false
        );
        expect(vm.timeJumps().nextDisabled, jump + "nextDisabled").toEqual(
          true
        );

        jump = "prev1 ";
        vm.handleTimeJump(mockGridRef as any, false);
        expect(
          mockGridRef.api.ensureNodeVisible,
          jump + "ensureNodeVisible"
        ).toHaveBeenNthCalledWith(4, "4", "middle");
        expect(vm.timeJumps().prevDisabled, jump + "prevDisabled").toEqual(
          false
        );
        expect(vm.timeJumps().nextDisabled, jump + "nextDisabled").toEqual(
          false
        );

        jump = "prev2 ";
        vm.handleTimeJump(mockGridRef as any, false);
        expect(
          mockGridRef.api.ensureNodeVisible,
          jump + "ensureNodeVisible"
        ).toHaveBeenNthCalledWith(5, "2", "middle");
        expect(vm.timeJumps().prevDisabled, jump + "prevDisabled").toEqual(
          false
        );
        expect(vm.timeJumps().nextDisabled, jump + "nextDisabled").toEqual(
          false
        );

        // jump to 0th row
        jump = "prev3 ";
        vm.handleTimeJump(mockGridRef as any, false);
        expect(
          mockGridRef.api.ensureNodeVisible,
          jump + "ensureNodeVisible"
        ).toHaveBeenNthCalledWith(6, "1", "middle");
        expect(vm.timeJumps().prevDisabled, jump + "prevDisabled").toEqual(
          true
        );
        expect(vm.timeJumps().nextDisabled, jump + "nextDisabled").toEqual(
          false
        );

        jump = "next1 ";
        vm.handleTimeJump(mockGridRef as any, true);
        expect(
          mockGridRef.api.ensureNodeVisible,
          jump + "ensureNodeVisible"
        ).toHaveBeenNthCalledWith(7, "2", "middle");
        expect(vm.timeJumps().prevDisabled, jump + "prevDisabled").toEqual(
          false
        );
        expect(vm.timeJumps().nextDisabled, jump + "nextDisabled").toEqual(
          false
        );

        dispose();
      });
    });
  });
});
