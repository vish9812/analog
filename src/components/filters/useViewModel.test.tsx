import { createRoot } from "solid-js";
import useViewModel, { FiltersProps } from "./useViewModel";
import comparer from "../../models/comparer";
import Processor from "../../models/processor";

describe("useViewModel", () => {
  const topLogs = [
    {
      count: 3,
      hasErrors: false,
      msg: "grp1",
    },
    {
      count: 1,
      hasErrors: true,
      msg: "grp2",
    },
    {
      count: 2,
      hasErrors: true,
      msg: "grp3",
    },
  ];

  comparer.removed = [topLogs[0], topLogs[2]];
  comparer.added = [
    {
      count: 5,
      hasErrors: false,
      msg: "grp11",
    },
    {
      count: 2,
      hasErrors: true,
      msg: "grp22",
    },
  ];

  const defaultFilters = {
    startTime: "",
    endTime: "",
    regex: "",
    msgs: [],
    errorsOnly: false,
  };

  let props: FiltersProps;

  beforeEach(() => {
    props = {
      onFiltersChange: vi.fn(),
    };

    const lastProcessor = new Processor();
    lastProcessor.topLogs = topLogs;
    vi.spyOn(comparer, "last").mockReturnValue(lastProcessor);
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
      vm.setFilters("msgs", ["some log"]);
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
        msgs: ["log1", "log2"],
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
      const rows = [{ msg: "log1" }, { msg: "log2" }];
      const msgs = rows.map((r) => r.msg);
      const selectionEvent = {
        api: {
          getSelectedRows: () => rows,
        },
      };

      const vm = useViewModel(props);
      vm.handleLogsSelectionChanged(selectionEvent as any);

      expect(vm.filters.msgs, "filters.msgs").toEqual(msgs);
      expect(props.onFiltersChange, "onFiltersChange").toBeCalledWith({
        ...defaultFilters,
        msgs,
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
});
