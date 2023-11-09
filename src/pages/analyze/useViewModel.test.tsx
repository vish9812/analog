import { createRoot } from "solid-js";
import useViewModel from "./useViewModel";
import gridService from "./gridService";
import { FiltersData } from "@al/components/filters/useViewModel";
import comparer from "@al/services/comparer";
import LogData from "@al/models/logData";
import timesUtils from "@al/utils/times";
import useJumper from "@al/components/timeJumps/useJumper";

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
      const mockUseJumper = {
        reset: vi.spyOn(useJumper, "reset"),
        validator: vi.spyOn(useJumper, "validator").mockReturnValue(vi.fn()),
        adder: vi.spyOn(useJumper, "adder").mockReturnValue({
          add: vi.fn(),
          done: vi.fn(),
        }),
      };

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

      expect(mockUseJumper.reset).toHaveBeenCalledOnce();
      expect(mockUseJumper.adder).toHaveBeenCalledOnce();
      expect(mockUseJumper.validator).toHaveBeenCalledOnce();

      dispose();
    });
  });

  test("handleTimeJump", () => {
    createRoot((dispose) => {
      const vm = useViewModel();

      const gridRef = {
        api: {
          ensureNodeVisible: () => {},
          getRowNode: vi.fn(),
        },
      };

      const id = "10";
      vm.handleTimeJump(gridRef as any, id);

      expect(gridRef.api.getRowNode, "getRowNode").toHaveBeenCalledWith(id);

      dispose();
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
