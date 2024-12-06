import { createRoot } from "solid-js";
import useViewModel, {
  FiltersData,
  GridsRefs,
  defaultFilters,
  savedFilterKey,
} from "./useViewModel";
import { FiltersProps } from "./useViewModel";
import comparer from "@al/services/comparer";
import LogData, { Summary } from "@al/models/logData";

describe("useViewModel", () => {
  const summary: Summary = {
    msgs: [
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
    ],
    httpCodes: [
      {
        logs: [{}, {}, {}],
        hasErrors: false,
        msg: "404",
      },
      {
        logs: [{}],
        hasErrors: true,
        msg: "200",
      },
    ],
    jobs: [
      {
        logs: [{}, {}, {}],
        hasErrors: false,
        msg: "job-1",
      },
      {
        logs: [{}],
        hasErrors: true,
        msg: "job-2",
      },
    ],
    plugins: [
      {
        logs: [{}, {}, {}],
        hasErrors: false,
        msg: "plugin-1",
      },
      {
        logs: [{}],
        hasErrors: true,
        msg: "plugin-2",
      },
    ],
  };

  comparer.removed = [summary.msgs[0], summary.msgs[2]];
  comparer.unchanged = [summary.msgs[1]];
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

  let props: FiltersProps;

  beforeEach(() => {
    props = {
      onFiltersChange: vi.fn(),
    };

    const lastLogData = new LogData();
    lastLogData.summary = summary;
    vi.spyOn(comparer, "last").mockReturnValue(lastLogData);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("initial values", () => {
    createRoot((dispose) => {
      const vm = useViewModel(null as any);

      expect(vm.savedFilterName(), "savedFilterName").toEqual("");
      expect(vm.addedLogs(), "addedLogs").toEqual(comparer.added);
      expect(vm.removedLogs(), "removedLogs").toEqual(comparer.removed);
      expect(vm.unchangedLogs(), "unchangedLogs").toEqual(comparer.unchanged);
      expect(vm.msgs(), "msgs").toEqual(comparer.last().summary.msgs);
      expect(vm.httpCodes(), "httpCodes").toEqual(
        comparer.last().summary.httpCodes
      );
      expect(vm.jobs(), "jobs").toEqual(comparer.last().summary.jobs);
      expect(vm.plugins(), "plugins").toEqual(comparer.last().summary.plugins);
      expect(vm.filters, "filters").toEqual(defaultFilters());

      dispose();
    });
  });

  describe("manageSavedFilters", () => {
    const filterName = "test_filter";

    const filterToSave: FiltersData = {
      startTime: "2023-10-20T01:00:00.000Z",
      endTime: "2023-10-20T11:00:00.000Z",
      errorsOnly: true,
      logs: [
        {
          some_key: "some_value",
        },
      ],
      regex: "^some.*regex$",
      terms: [
        {
          and: true,
          contains: true,
          field: "some_field",
          value: "ands",
        },
      ],
      firstN: 1,
      lastN: 1,
    };

    const expectedSavedFilter = { ...filterToSave, logs: [] };

    beforeEach(() => {
      localStorage.clear();
    });

    test("handleSaveFilter", () => {
      createRoot((dispose) => {
        const vm = useViewModel(props);

        vm.setFilters(filterToSave);
        vm.setSavedFilterName(filterName);
        vm.handleSaveFilter();

        expect(vm.savedFilterName(), "savedFilterName").toEqual(filterName);
        expect(localStorage.length, "localStorage.length").toEqual(1);
        const loadedFilterStr = localStorage.getItem(
          savedFilterKey(filterName)
        );
        expect(loadedFilterStr, "loadedFilterStr").toBeTruthy();
        const loadedFilterJSON = JSON.parse(loadedFilterStr!);
        expect(loadedFilterJSON, "loadedFilterJSON").toEqual(
          expectedSavedFilter
        );

        dispose();
      });
    });

    test("handleDeleteFilters", () => {
      createRoot((dispose) => {
        const vm = useViewModel(props);

        vm.setFilters(filterToSave);
        vm.setSavedFilterName(filterName);

        expect(localStorage.length, "localStorage.length-pre-save").toEqual(0);
        vm.handleSaveFilter();

        expect(localStorage.length, "localStorage.length-pre-clear").toEqual(1);
        vm.handleDeleteFilters();
        expect(localStorage.length, "localStorage.length-post-clear").toEqual(
          0
        );
        expect(vm.savedFilterName(), "savedFilterName").toEqual("");

        dispose();
      });
    });

    describe("handleLoadFilter", () => {
      test("whenNoFilterIsAvailableToLoad", () => {
        createRoot((dispose) => {
          const vm = useViewModel(props);

          vm.handleLoadFilter(filterName);

          expect(vm.savedFilterName(), "savedFilterName").toEqual("");
          expect(vm.filters, "filters").toEqual(defaultFilters());
          expect(props.onFiltersChange, "onFiltersChange").toBeCalledTimes(0);

          dispose();
        });
      });

      test("whenAFilterIsAvailableToLoad", () => {
        createRoot((dispose) => {
          const vm = useViewModel(props);

          localStorage.setItem(
            savedFilterKey(filterName),
            JSON.stringify(expectedSavedFilter)
          );
          vm.handleLoadFilter(filterName);

          expect(vm.savedFilterName(), "savedFilterName").toEqual(filterName);
          expect(vm.filters, "filters").toEqual(expectedSavedFilter);
          expect(props.onFiltersChange, "onFiltersChange").toBeCalledWith(
            vm.filters
          );

          dispose();
        });
      });
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
          setFilterModel: vi.fn(),
        },
      });
      const gridsRefs: GridsRefs = {
        msgs: getGrid() as any,
        httpCodes: getGrid() as any,
        jobs: getGrid() as any,
        plugins: getGrid() as any,
        added: getGrid() as any,
        removed: getGrid() as any,
        unchanged: getGrid() as any,
      };

      const vm = useViewModel(props);
      vm.setFilters(() => ({
        startTime: "some start time",
        endTime: "some end time",
        regex: "some regex",
        logs: [{}, {}],
        errorsOnly: true,
      }));
      expect(vm.filters.regex, "regex").toEqual("some regex");

      vm.setSavedFilterName("test_filter")

      vm.handleResetClick(gridsRefs);

      expect(vm.savedFilterName(), "savedFilterName").toEqual("");
      expect(vm.filters, "filters").toEqual(defaultFilters());
      expect(vm.addedLogs(), "addedLogs").toEqual(comparer.added);
      expect(vm.removedLogs(), "removedLogs").toEqual(comparer.removed);
      expect(vm.unchangedLogs(), "unchangedLogs").toEqual(comparer.unchanged);
      expect(vm.msgs(), "msgs").toEqual(comparer.last().summary.msgs);
      expect(vm.httpCodes(), "httpCodes").toEqual(
        comparer.last().summary.httpCodes
      );
      expect(vm.jobs(), "jobs").toEqual(comparer.last().summary.jobs);
      expect(vm.plugins(), "plugins").toEqual(comparer.last().summary.plugins);

      expect(props.onFiltersChange, "onFiltersChange").toBeCalledWith(
        defaultFilters()
      );
      expect(
        gridsRefs.msgs.api.deselectAll,
        "msgs.api.deselectAll"
      ).toHaveBeenCalledOnce();
      expect(
        gridsRefs.msgs.api.setFilterModel,
        "msgs.api.setFilterModel"
      ).toHaveBeenCalledOnce();
      expect(
        gridsRefs.httpCodes.api.deselectAll,
        "httpCodes.api.deselectAll"
      ).toHaveBeenCalledOnce();
      expect(
        gridsRefs.httpCodes.api.setFilterModel,
        "httpCodes.api.setFilterModel"
      ).toHaveBeenCalledOnce();
      expect(
        gridsRefs.jobs.api.deselectAll,
        "jobs.api.deselectAll"
      ).toHaveBeenCalledOnce();
      expect(
        gridsRefs.jobs.api.setFilterModel,
        "jobs.api.setFilterModel"
      ).toHaveBeenCalledOnce();
      expect(
        gridsRefs.plugins.api.deselectAll,
        "plugins.api.deselectAll"
      ).toHaveBeenCalledOnce();
      expect(
        gridsRefs.plugins.api.setFilterModel,
        "plugins.api.setFilterModel"
      ).toHaveBeenCalledOnce();

      dispose();
    });
  });

  test("handleLogsSelectionChanged", () => {
    createRoot((dispose) => {
      const gridsRefs: GridsRefs = {
        msgs: {
          api: {
            getSelectedRows: () => [
              { logs: [{ id: 1 }, { id: 2 }] },
              { logs: [{ id: 3 }] },
            ],
          },
        } as any,
        httpCodes: {
          api: {
            getSelectedRows: () => [
              { logs: [{ id: 1 }, { id: 2 }] },
              { logs: [{ id: 4 }] },
            ],
          },
        } as any,
        jobs: {
          api: {
            getSelectedRows: () => [{ logs: [{ id: 5 }] }],
          },
        } as any,
        plugins: {
          api: {
            getSelectedRows: () => [
              { logs: [{ id: 4 }, { id: 5 }] },
              { logs: [{ id: 6 }] },
            ],
          },
        } as any,
        added: {
          api: {
            getSelectedRows: () => [
              { logs: [{ id: 1 }, { id: 7 }, { id: 10 }, { id: 20 }] },
              { logs: [{ id: 3 }, { id: 30 }] },
            ],
          },
        } as any,
        unchanged: {
          api: {
            getSelectedRows: () => [
              { logs: [{ id: 2 }, { id: 11 }, { id: 4 }] },
              { logs: [{ id: 5 }] },
            ],
          },
        } as any,
        removed: undefined as any,
      };

      const vm = useViewModel(props);
      vm.setFilters("firstN", 1);
      vm.setFilters("lastN", 1);
      vm.handleLogsSelectionChanged(gridsRefs);

      const logs = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
        // { id: 7 }, // all 3 are skipped due to firstN=1 and lastN=1, so only first 1 and last 1 logs are selected
        // { id: 10 },
        // { id: 11 },
        { id: 20 },
        { id: 30 },
      ];
      expect(vm.filters.logs, "filters.logs").toEqual(logs);
      expect(props.onFiltersChange, "onFiltersChange").toBeCalledWith({
        ...vm.filters,
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

        const errMsgs = [summary.msgs[1], summary.msgs[2]];
        const errHTTPCodes = [summary.httpCodes[1]];
        const errJobs = [summary.jobs[1]];
        const errPlugins = [summary.plugins[1]];
        const errAddedTopLogs = [comparer.added[1]];
        const errRemovedTopLogs = [comparer.removed[1]];
        const errUnchangedTopLogs = [comparer.unchanged[0]];

        expect(vm.filters.errorsOnly, "errorsOnly").toEqual(checked);
        expect(vm.addedLogs(), "addedLogs").toEqual(errAddedTopLogs);
        expect(vm.removedLogs(), "removedLogs").toEqual(errRemovedTopLogs);
        expect(vm.unchangedLogs(), "unchangedLogs").toEqual(
          errUnchangedTopLogs
        );
        expect(vm.msgs(), "msgs").toEqual(errMsgs);
        expect(vm.httpCodes(), "httpCodes").toEqual(errHTTPCodes);
        expect(vm.jobs(), "jobs").toEqual(errJobs);
        expect(vm.plugins(), "plugins").toEqual(errPlugins);
        expect(props.onFiltersChange, "onFiltersChange").toBeCalledWith({
          ...defaultFilters(),
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
        expect(vm.addedLogs(), "addedLogs").toEqual(comparer.added);
        expect(vm.removedLogs(), "removedLogs").toEqual(comparer.removed);
        expect(vm.unchangedLogs(), "unchangedLogs").toEqual(comparer.unchanged);
        expect(vm.msgs(), "msgs").toEqual(summary.msgs);
        expect(vm.httpCodes(), "httpCodes").toEqual(summary.httpCodes);
        expect(vm.jobs(), "jobs").toEqual(summary.jobs);
        expect(vm.plugins(), "plugins").toEqual(summary.plugins);
        expect(props.onFiltersChange, "onFiltersChange").toBeCalledWith(
          defaultFilters()
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
          field: "",
          value: "",
        },
      ]);

      vm.handleNewSearchTerm(false);
      expect(vm.filters.terms, "term removed").toEqual(original);

      dispose();
    });
  });
});
