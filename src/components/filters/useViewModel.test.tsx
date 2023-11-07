import { createRoot } from "solid-js";
import useViewModel from "./useViewModel";
import { FiltersData, FiltersProps } from "./useViewModel";
import comparer from "@al/services/comparer";
import LogData, { GroupedMsg } from "@al/models/logData";

describe("useViewModel", () => {
  const topLogs: GroupedMsg[] = [
    {
      logs: [{}, {}, {}],
      hasErrors: false,
      msg: "grp1",
    },
    {
      logs: [{}],
      hasErrors: true,
      msg: "grp2",
    },
    {
      logs: [{}, {}],
      hasErrors: true,
      msg: "grp3",
    },
  ];

  comparer.removed = [topLogs[0], topLogs[2]];
  comparer.added = [
    {
      logs: [{}, {}, {}, {}, {}],
      hasErrors: false,
      msg: "grp11",
    },
    {
      logs: [{}, {}],
      hasErrors: true,
      msg: "grp22",
    },
  ];

  const defaultFilters: FiltersData = {
    startTime: "",
    endTime: "",
    regex: "",
    terms: [
      {
        and: true,
        contains: true,
        value: "",
      },
    ],
    logs: [],
    errorsOnly: false,
  };

  let props: FiltersProps;

  beforeEach(() => {
    props = {
      onFiltersChange: vi.fn(),
    };

    const lastLogData = new LogData();
    lastLogData.topLogs = topLogs;
    vi.spyOn(comparer, "last").mockReturnValue(lastLogData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("initial values", () => {
    createRoot((dispose) => {
      const vm = useViewModel(null as any);

      expect(vm.addedMsgs(), "addedMsgs").toEqual(comparer.added);
      expect(vm.removedMsgs(), "removedMsgs").toEqual(comparer.removed);
      expect(vm.topLogs(), "topLogs").toEqual(comparer.last().topLogs);
      expect(vm.filters, "filters").toEqual(defaultFilters);

      dispose();
    });
  });

  test("handleFiltersChange", () => {
    createRoot((dispose) => {
      const vm = useViewModel(props);
      vm.setFilters("logs", [{}]);
      vm.handleFiltersChange();
      expect(props.onFiltersChange, "onFiltersChange").toBeCalledWith(
        vm.filters
      );

      dispose();
    });
  });

  test("handleResetClick", () => {
    createRoot((dispose) => {
      const getGrid = () => ({
        api: {
          deselectAll: vi.fn(),
        },
      });
      const topMsgsGridRef = getGrid();
      const addedMsgsGridRef = getGrid();

      const vm = useViewModel(props);
      vm.setFilters(() => ({
        startTime: "some start time",
        endTime: "some end time",
        regex: "some regex",
        logs: [{}, {}],
        errorsOnly: true,
      }));
      expect(vm.filters.regex, "regex").toEqual("some regex");

      vm.handleResetClick(topMsgsGridRef as any, addedMsgsGridRef as any);

      expect(vm.filters, "filters").toEqual(defaultFilters);
      expect(vm.addedMsgs(), "addedMsgs").toEqual(comparer.added);
      expect(vm.removedMsgs(), "removedMsgs").toEqual(comparer.removed);
      expect(vm.topLogs(), "topLogs").toEqual(comparer.last().topLogs);
      expect(props.onFiltersChange, "onFiltersChange").toBeCalledWith(
        defaultFilters
      );
      expect(topMsgsGridRef.api.deselectAll).toHaveBeenCalledOnce();
      expect(addedMsgsGridRef.api.deselectAll).toHaveBeenCalledOnce();
      dispose();
    });
  });

  test("handleLogsSelectionChanged", () => {
    createRoot((dispose) => {
      const rows = [{ logs: [{}, {}] }, { logs: [{}] }];
      const logs = rows.flatMap((r) => r.logs);
      const selectionEvent = {
        api: {
          getSelectedRows: () => rows,
        },
      };

      const vm = useViewModel(props);
      vm.handleLogsSelectionChanged(selectionEvent as any);

      expect(vm.filters.logs, "filters.msgs").toEqual(logs);
      expect(props.onFiltersChange, "onFiltersChange").toBeCalledWith({
        ...defaultFilters,
        logs,
      });

      dispose();
    });
  });

  describe("handleErrorsOnlyChange", () => {
    test("checked", () => {
      const checked = true;
      createRoot((dispose) => {
        const vm = useViewModel(props);
        vm.handleErrorsOnlyChange(checked);

        const errTopLogs = [topLogs[1], topLogs[2]];
        const errAddedTopLogs = [comparer.added[1]];
        const errRemovedTopLogs = [comparer.removed[1]];

        expect(vm.filters.errorsOnly, "errorsOnly").toEqual(checked);
        expect(vm.addedMsgs(), "addedMsgs").toEqual(errAddedTopLogs);
        expect(vm.removedMsgs(), "removedMsgs").toEqual(errRemovedTopLogs);
        expect(vm.topLogs(), "topLogs").toEqual(errTopLogs);
        expect(props.onFiltersChange, "onFiltersChange").toBeCalledWith({
          ...defaultFilters,
          errorsOnly: checked,
        });

        dispose();
      });
    });

    test("NOT checked", () => {
      const checked = false;
      createRoot((dispose) => {
        const vm = useViewModel(props);
        vm.handleErrorsOnlyChange(checked);

        expect(vm.filters.errorsOnly, "errorsOnly").toEqual(checked);
        expect(vm.addedMsgs(), "addedMsgs").toEqual(comparer.added);
        expect(vm.removedMsgs(), "removedMsgs").toEqual(comparer.removed);
        expect(vm.topLogs(), "topLogs").toEqual(comparer.last().topLogs);
        expect(props.onFiltersChange, "onFiltersChange").toBeCalledWith(
          defaultFilters
        );

        dispose();
      });
    });
  });

  test("handleNewSearchTerm", () => {
    createRoot((dispose) => {
      const vm = useViewModel(props);
      const original = [...vm.filters.terms];

      vm.handleNewSearchTerm(true);
      expect(vm.filters.terms, "term added").toEqual([
        ...original,
        {
          and: true,
          contains: true,
          value: "",
        },
      ]);

      vm.handleNewSearchTerm(false);
      expect(vm.filters.terms, "term removed").toEqual(original);

      dispose();
    });
  });
});
