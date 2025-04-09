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

  describe("handleFiltersChange", () => {
    const logs = [
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
        custom_key_1: "custom value 1",
      },
      {
        [LogData.logKeys.id]: "24",
        [LogData.logKeys.timestamp]: "2023-10-20T10:00:00.000Z",
        [LogData.logKeys.fullData]: "test one two ands four",
        [LogData.logKeys.msg]: "test one two ands four",
        custom_key_1: "custom value 2",
      },
      {
        [LogData.logKeys.id]: "25",
        [LogData.logKeys.timestamp]: "2023-10-20T10:00:00.000Z",
        [LogData.logKeys.fullData]: "test one two ands four",
        [LogData.logKeys.msg]: "test one two ands four",
        custom_key_2: "custom value 2",
      },
      {
        [LogData.logKeys.id]: "30",
        [LogData.logKeys.timestamp]: "2023-10-20T12:00:00.000Z",
        [LogData.logKeys.fullData]: "msg four five six",
        [LogData.logKeys.msg]: "msg four five six",
      },
    ];

    let mockUseJumper: any;

    beforeEach(() => {
      vi.spyOn(comparer, "last").mockReturnValue(logs as any);

      vi.spyOn(LogData, "isErrorLog")
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      vi.spyOn(timesUtils, "diffMinutes").mockReturnValue(100);
      mockUseJumper = {
        reset: vi.spyOn(useJumper, "reset"),
        validator: vi.spyOn(useJumper, "validator").mockReturnValue(vi.fn()),
        adder: vi.spyOn(useJumper, "adder").mockReturnValue({
          add: vi.fn(),
          done: vi.fn(),
        }),
      };
    });

    afterEach(() => {
      expect(mockUseJumper.reset).toHaveBeenCalledOnce();
      expect(mockUseJumper.adder).toHaveBeenCalledOnce();
      expect(mockUseJumper.validator).toHaveBeenCalledOnce();

      vi.clearAllMocks();
    });

    test("and + contains true for term 'ands'", () => {
      createRoot((dispose) => {
        const filters: FiltersData = {
          startTime: "2023-10-20T01:00:00.000Z",
          endTime: "2023-10-20T11:00:00.000Z",
          errorsOnly: true,
          logs,
          regex: "",
          terms: [
            {
              and: true,
              contains: true,
              field: "",
              value: "ands",
            },
          ],
          firstN: 0,
          lastN: 0,
        };

        const vm = useViewModel();
        vm.handleFiltersChange(filters);

        expect(vm.rows()).toEqual([logs[3], logs[4]]);

        dispose();
      });
    });

    test("and + contains false for term 'ands'", () => {
      createRoot((dispose) => {
        const filters: FiltersData = {
          startTime: "2023-10-20T01:00:00.000Z",
          endTime: "2023-10-20T11:00:00.000Z",
          errorsOnly: true,
          logs,
          regex: "",
          terms: [
            {
              and: true,
              contains: false,
              field: "",
              value: "ands",
            },
          ],
          firstN: 0,
          lastN: 0,
        };

        const vm = useViewModel();
        vm.handleFiltersChange(filters);

        expect(vm.rows()).toEqual([logs[0], logs[1], logs[2]]);

        dispose();
      });
    });

    test("or + contains true for term 'check'", () => {
      createRoot((dispose) => {
        const filters: FiltersData = {
          startTime: "2023-10-20T01:00:00.000Z",
          endTime: "2023-10-20T11:00:00.000Z",
          errorsOnly: true,
          logs,
          regex: "",
          terms: [
            {
              and: false,
              contains: true,
              field: "",
              value: "check",
            },
          ],
          firstN: 0,
          lastN: 0,
        };

        const vm = useViewModel();
        vm.handleFiltersChange(filters);

        expect(vm.rows()).toEqual([logs[2]]);

        dispose();
      });
    });

    test("combination of 'and' and 'or'", () => {
      createRoot((dispose) => {
        const filters: FiltersData = {
          startTime: "2023-10-20T01:00:00.000Z",
          endTime: "2023-10-20T11:00:00.000Z",
          errorsOnly: true,
          logs,
          regex: "",
          terms: [
            {
              and: true,
              contains: true,
              field: "",
              value: "check",
            },
            {
              and: false,
              contains: true,
              field: "",
              value: "one",
            },
          ],
          firstN: 0,
          lastN: 0,
        };

        const vm = useViewModel();
        vm.handleFiltersChange(filters);

        // Expect logs that satisfy both 'and' and either of the 'or' conditions
        expect(vm.rows()).toEqual([logs[2]]);

        dispose();
      });
    });

    test("combination of 'not and' and 'or'", () => {
      createRoot((dispose) => {
        const filters: FiltersData = {
          startTime: "2023-10-20T01:00:00.000Z",
          endTime: "2023-10-20T11:00:00.000Z",
          errorsOnly: true,
          logs,
          regex: "",
          terms: [
            {
              and: true,
              contains: false,
              field: "",
              value: "test",
            },
            {
              and: false,
              contains: true,
              field: "",
              value: "one",
            },
          ],
          firstN: 0,
          lastN: 0,
        };

        const vm = useViewModel();
        vm.handleFiltersChange(filters);

        // Expect logs that don't contain 'test' but contain 'one'
        expect(vm.rows()).toEqual([logs[0]]);

        dispose();
      });
    });

    test("combination of 'and', 'or', and 'not and'", () => {
      createRoot((dispose) => {
        const filters: FiltersData = {
          startTime: "2023-10-20T01:00:00.000Z",
          endTime: "2023-10-20T11:00:00.000Z",
          errorsOnly: true,
          logs,
          regex: "",
          terms: [
            {
              and: true,
              contains: true,
              field: "",
              value: "four",
            },
            {
              and: true,
              contains: false,
              field: "",
              value: "ands",
            },
            {
              and: false,
              contains: true,
              field: "",
              value: "one",
            },
          ],
          firstN: 0,
          lastN: 0,
        };

        const vm = useViewModel();
        vm.handleFiltersChange(filters);

        // Expect logs that matches "or" filter but then further filter with "ands" and finally filter out "not ands"
        // In this example get all logs with "one"(or), then filter for "four"(and) and finally filter out "ands"(not and)
        expect(vm.rows()).toEqual([logs[1], logs[2]]);

        dispose();
      });
    });

    test("apply regex filter", () => {
      createRoot((dispose) => {
        const filters: FiltersData = {
          startTime: "2023-10-20T01:00:00.000Z",
          endTime: "2023-10-20T11:00:00.000Z",
          errorsOnly: true,
          logs,
          regex: "^msg.*three$",
          terms: [],
          firstN: 0,
          lastN: 0,
        };

        const vm = useViewModel();
        vm.handleFiltersChange(filters);

        // Expect logs that match the regex pattern: start with "msg" and end with "three"
        expect(vm.rows()).toEqual([logs[0]]);

        dispose();
      });
    });

    test("filter with a valid field and no value", () => {
      createRoot((dispose) => {
        const filters: FiltersData = {
          startTime: "2023-10-20T01:00:00.000Z",
          endTime: "2023-10-20T11:00:00.000Z",
          errorsOnly: true,
          logs,
          regex: "",
          terms: [
            {
              and: true,
              contains: true,
              field: "custom_key_1",
              value: "", // No value specified
            },
          ],
          firstN: 0,
          lastN: 0,
        };

        const vm = useViewModel();
        vm.handleFiltersChange(filters);

        // Expect logs where "custom_key_1" exists, regardless of its value
        expect(vm.rows()).toEqual([logs[2], logs[3]]);

        dispose();
      });
    });

    test("filter with both a valid field and a specific value", () => {
      createRoot((dispose) => {
        const filters: FiltersData = {
          startTime: "2023-10-20T01:00:00.000Z",
          endTime: "2023-10-20T11:00:00.000Z",
          errorsOnly: true,
          logs,
          regex: "",
          terms: [
            {
              and: true,
              contains: true,
              field: "custom_key_1",
              value: "custom value 1", // Specific value provided
            },
          ],
          firstN: 0,
          lastN: 0,
        };

        const vm = useViewModel();
        vm.handleFiltersChange(filters);

        // Expect logs where "custom_key_1" exists with the exact value "custom value 1"
        expect(vm.rows()).toEqual([logs[2]]);

        dispose();
      });
    });

    test("filter with a non-existent field", () => {
      createRoot((dispose) => {
        const filters: FiltersData = {
          startTime: "2023-10-20T01:00:00.000Z",
          endTime: "2023-10-20T11:00:00.000Z",
          errorsOnly: true,
          logs,
          regex: "",
          terms: [
            {
              and: true,
              contains: true,
              field: "non_existent_key", // Field that doesn't exist in any log
              value: "custom value 1", // Valid value provided
            },
          ],
          firstN: 0,
          lastN: 0,
        };

        const vm = useViewModel();
        vm.handleFiltersChange(filters);

        // Expect no logs, since no logs contain "non_existent_key"
        expect(vm.rows()).toEqual([]);

        dispose();
      });
    });

    test("filter with a valid field but an invalid value", () => {
      createRoot((dispose) => {
        const filters: FiltersData = {
          startTime: "2023-10-20T01:00:00.000Z",
          endTime: "2023-10-20T11:00:00.000Z",
          errorsOnly: true,
          logs,
          regex: "",
          terms: [
            {
              and: true,
              contains: true,
              field: "custom_key_1", // Valid Field
              value: "non existent value", // Invalid value
            },
          ],
          firstN: 0,
          lastN: 0,
        };

        const vm = useViewModel();
        vm.handleFiltersChange(filters);

        // Expect no logs, since no logs contain "custom_key_1" with the specified invalid value
        expect(vm.rows()).toEqual([]);

        dispose();
      });
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
