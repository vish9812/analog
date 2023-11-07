import { createRoot } from "solid-js";
import useViewModel from "./useViewModel";
import gridService from "./gridService";
import { FiltersData } from "@al/components/filters/useViewModel";
import comparer from "@al/services/comparer";
import LogData from "@al/models/logData";
import filesUtils from "@al/utils/files";
import timesUtils from "@al/utils/times";

describe("useViewModel", () => {
  beforeEach(() => {
    const logData = new LogData();
    logData.logs = [
      { [LogData.logKeys.fullData]: "json string 1" },
      { [LogData.logKeys.fullData]: "json string 2" },
    ];
    vi.spyOn(comparer, "last").mockReturnValue(logData);
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
          comparer.last().logs[0][LogData.logKeys.fullData],
          comparer.last().logs[1][LogData.logKeys.fullData],
        ]
      );

      dispose();
    });
  });

  test("handleFiltersChange", () => {
    createRoot((dispose) => {
      comparer.last().logs = [
        {
          [LogData.logKeys.id]: "10",
          [LogData.logKeys.timestamp]: "2023-10-20T08:00:00.000Z",
          [LogData.logKeys.fullData]: "msg one two three",
          [LogData.logKeys.msg]: "msg one two three",
        },
        {
          [LogData.logKeys.id]: "20",
          [LogData.logKeys.timestamp]: "2023-10-20T10:00:00.000Z",
          [LogData.logKeys.fullData]: "test one two four",
          [LogData.logKeys.msg]: "test one two four",
        },
        {
          [LogData.logKeys.id]: "23",
          [LogData.logKeys.timestamp]: "2023-10-20T10:00:00.000Z",
          [LogData.logKeys.fullData]: "test one two contains check four",
          [LogData.logKeys.msg]: "test one two contains check four",
        },
        {
          [LogData.logKeys.id]: "24",
          [LogData.logKeys.timestamp]: "2023-10-20T10:00:00.000Z",
          [LogData.logKeys.fullData]: "test one two ands check four",
          [LogData.logKeys.msg]: "test one two ands check four",
        },
        {
          [LogData.logKeys.id]: "30",
          [LogData.logKeys.timestamp]: "2023-10-20T12:00:00.000Z",
          [LogData.logKeys.fullData]: "msg four five six",
          [LogData.logKeys.msg]: "msg four five six",
        },
      ];

      vi.spyOn(LogData, "isErrorLog")
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      vi.spyOn(timesUtils, "diffMinutes").mockReturnValue(100);

      const filters: FiltersData = {
        startTime: "2023-10-20T01:00:00.000Z",
        endTime: "2023-10-20T11:00:00.000Z",
        errorsOnly: true,
        logs: [
          comparer.last().logs[1],
          comparer.last().logs[2],
          comparer.last().logs[3],
          comparer.last().logs[4],
        ],
        regex: "^tes.*our$",
        terms: [
          {
            and: true,
            contains: true,
            value: "ands",
          },
          {
            and: true,
            contains: false,
            value: "msg",
          },
          {
            and: false,
            contains: true,
            value: "check",
          },
        ],
      };

      const vm = useViewModel();
      vm.handleFiltersChange(filters);

      expect(vm.rows(), "rows").toEqual([
        comparer.last().logs[2],
        comparer.last().logs[3],
      ]);
      expect(vm.timeJumps().prevDisabled, "prevDisabled").toEqual(true);
      expect(vm.timeJumps().nextDisabled, "nextDisabled").toEqual(false);

      dispose();
    });
  });

  describe("handleTimeJump", () => {
    let filters: FiltersData;
    beforeEach(() => {
      const logData = new LogData();
      logData.logs = [
        {
          [LogData.logKeys.id]: "1",
          [LogData.logKeys.timestamp]: "2023-10-20T08:00:00.000Z",
          [LogData.logKeys.fullData]: "json string 1",
        },
        {
          [LogData.logKeys.id]: "2",
          [LogData.logKeys.timestamp]: "2023-10-20T10:00:00.000Z",
          [LogData.logKeys.fullData]: "json string 2",
        },
        {
          [LogData.logKeys.id]: "3",
          [LogData.logKeys.timestamp]: "2023-10-20T12:00:00.000Z",
          [LogData.logKeys.fullData]: "json string 3",
        },
        {
          [LogData.logKeys.id]: "4",
          [LogData.logKeys.timestamp]: "2023-10-20T14:00:00.000Z",
          [LogData.logKeys.fullData]: "json string 4",
        },
        {
          [LogData.logKeys.id]: "5",
          [LogData.logKeys.timestamp]: "2023-10-20T16:00:00.000Z",
          [LogData.logKeys.fullData]: "json string 5",
        },
      ];
      vi.spyOn(comparer, "last").mockReturnValue(logData);

      vi.spyOn(timesUtils, "diffMinutes")
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(50)
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(70)
        .mockReturnValueOnce(30);

      filters = {
        logs: [],
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

  test("handleContextClick", () => {
    createRoot((dispose) => {
      comparer.last().logs = [
        {
          [LogData.logKeys.id]: "0",
          [LogData.logKeys.fullData]: "msg a",
        },
        {
          [LogData.logKeys.id]: "1",
          [LogData.logKeys.fullData]: "test b",
        },
        {
          [LogData.logKeys.id]: "2",
          [LogData.logKeys.fullData]: "msg c",
        },
        {
          [LogData.logKeys.id]: "3",
          [LogData.logKeys.fullData]: "test d",
        },
        {
          [LogData.logKeys.id]: "4",
          [LogData.logKeys.fullData]: "msg e",
        },
        {
          [LogData.logKeys.id]: "5",
          [LogData.logKeys.fullData]: "test f",
        },
        {
          [LogData.logKeys.id]: "6",
          [LogData.logKeys.fullData]: "msg g",
        },
        {
          [LogData.logKeys.id]: "7",
          [LogData.logKeys.fullData]: "test h",
        },
        {
          [LogData.logKeys.id]: "8",
          [LogData.logKeys.fullData]: "msg i",
        },
      ];

      const vm = useViewModel();
      const filtersData: FiltersData = {
        regex: "test",
        logs: [],
      } as any;
      vm.handleFiltersChange(filtersData);
      expect(vm.rows(), "rows: test filtered").toEqual([
        comparer.last().logs[1],
        comparer.last().logs[3],
        comparer.last().logs[5],
        comparer.last().logs[7],
      ]);

      const gridApi = {
        getRowNode: (i: number): boolean =>
          vm.rows().includes(comparer.last().logs[i]),
      };

      vm.handleContextClick(gridApi as any, 1);

      expect(vm.rows(), "rows: logID 1").toEqual([
        comparer.last().logs[1],
        comparer.last().logs[3],
        comparer.last().logs[5],
        comparer.last().logs[7],
        comparer.last().logs[0],
        comparer.last().logs[2],
        comparer.last().logs[4],
        comparer.last().logs[6],
      ]);

      vm.handleContextClick(gridApi as any, 1);

      expect(vm.rows(), "rows: logID 1 again: no change").toEqual([
        comparer.last().logs[1],
        comparer.last().logs[3],
        comparer.last().logs[5],
        comparer.last().logs[7],
        comparer.last().logs[0],
        comparer.last().logs[2],
        comparer.last().logs[4],
        comparer.last().logs[6],
      ]);

      vm.handleContextClick(gridApi as any, 7);

      expect(vm.rows(), "rows: logID 7").toEqual([
        comparer.last().logs[1],
        comparer.last().logs[3],
        comparer.last().logs[5],
        comparer.last().logs[7],
        comparer.last().logs[0],
        comparer.last().logs[2],
        comparer.last().logs[4],
        comparer.last().logs[6],
        comparer.last().logs[8],
      ]);

      dispose();
    });
  });
});
