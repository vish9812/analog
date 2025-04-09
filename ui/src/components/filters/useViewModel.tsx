import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { AgGridSolidRef } from "ag-grid-solid";
import comparer from "@al/services/comparer";
import LogData, { JSONLogs, GroupedMsg, JSONLog } from "@al/models/logData";

interface FiltersProps {
  onFiltersChange: (filters: FiltersData) => void;
}

interface GridsRefs {
  msgs: AgGridSolidRef;
  httpCodes: AgGridSolidRef;
  jobs: AgGridSolidRef;
  plugins: AgGridSolidRef;
  unchanged: AgGridSolidRef;
  added: AgGridSolidRef;
  removed: AgGridSolidRef;
}

interface SearchTerm {
  and: boolean;
  contains: boolean;
  field: string;
  value: string;
}

interface FiltersData {
  startTime: string;
  endTime: string;
  regex: string;
  terms: SearchTerm[];
  logs: JSONLogs;
  errorsOnly: boolean;
  firstN: number;
  lastN: number;
}

function defaultFilters(): FiltersData {
  return {
    startTime: "",
    endTime: "",
    regex: "",
    terms: [
      {
        and: true,
        contains: true,
        field: "",
        value: "",
      },
    ],
    logs: [],
    errorsOnly: false,
    firstN: 0,
    lastN: 0,
  };
}

const savedFiltersKeyPrefix = "saved_filters|";

function savedFilterKey(filterName: string): string {
  return savedFiltersKeyPrefix + filterName;
}

function savedFiltersKeys(): string[] {
  return Object.keys(localStorage).filter((key) =>
    key.startsWith(savedFiltersKeyPrefix)
  );
}

function savedFiltersNames(): string[] {
  return savedFiltersKeys().map((key) => key.split("|")[1]);
}

function useViewModel(props: FiltersProps) {
  const [filters, setFilters] = createStore(defaultFilters());
  const [savedFilterName, setSavedFilterName] = createSignal("");
  const [msgs, setMsgs] = createSignal(comparer.last().summary.msgs);
  const [httpCodes, setHTTPCodes] = createSignal(
    comparer.last().summary.httpCodes
  );
  const [jobs, setJobs] = createSignal(comparer.last().summary.jobs);
  const [plugins, setPlugins] = createSignal(comparer.last().summary.plugins);
  const [unchangedLogs, setUnchangedLogs] = createSignal(comparer.unchanged);
  const [addedLogs, setAddedLogs] = createSignal(comparer.added);
  const [removedLogs, setRemovedLogs] = createSignal(comparer.removed);

  function handleFiltersChange() {
    props.onFiltersChange(filters);
  }

  function handleResetClick(gridsRefs: GridsRefs) {
    setSavedFilterName("");
    setFilters(defaultFilters());
    handleErrorsOnlyChange(false);

    gridsRefs.msgs.api.setFilterModel(null);
    gridsRefs.msgs.api.deselectAll();

    gridsRefs.httpCodes.api.setFilterModel(null);
    gridsRefs.httpCodes.api.deselectAll();

    gridsRefs.jobs.api.setFilterModel(null);
    gridsRefs.jobs.api.deselectAll();

    gridsRefs.plugins.api.setFilterModel(null);
    gridsRefs.plugins.api.deselectAll();

    if (addedLogs().length > 0) {
      gridsRefs.added.api.setFilterModel(null);
      gridsRefs.added.api.deselectAll();
    }

    if (unchangedLogs().length > 0) {
      gridsRefs.unchanged.api.setFilterModel(null);
      gridsRefs.unchanged.api.deselectAll();
    }
  }

  function handleLogsSelectionChanged(gridsRefs: GridsRefs) {
    const map = new Map<string, JSONLog>();
    populateMap(gridsRefs.msgs);
    populateMap(gridsRefs.httpCodes);
    populateMap(gridsRefs.jobs);
    populateMap(gridsRefs.plugins);

    if (addedLogs().length > 0) {
      populateMap(gridsRefs.added);
    }

    if (unchangedLogs().length > 0) {
      populateMap(gridsRefs.unchanged);
    }

    setFilters("logs", [...map.values()]);
    handleFiltersChange();

    function populateMap(gridRef: AgGridSolidRef) {
      for (const r of gridRef.api.getSelectedRows() as GroupedMsg[]) {
        let nLogs: JSONLogs = [];
        if (filters.firstN) {
          nLogs = r.logs.slice(0, filters.firstN);
        }
        if (filters.lastN) {
          nLogs = [...nLogs, ...r.logs.slice(-filters.lastN)];
        }

        if (!nLogs.length) nLogs = r.logs;

        nLogs.forEach((l) => map.set(l[LogData.logKeys.id], l));
      }
    }
  }

  function handleErrorsOnlyChange(checked: boolean) {
    setFilters("errorsOnly", checked);

    if (checked) {
      setMsgs(LogData.errorFilterFn);
      setHTTPCodes(LogData.errorFilterFn);
      setJobs(LogData.errorFilterFn);
      setPlugins(LogData.errorFilterFn);
      setUnchangedLogs(LogData.errorFilterFn);
      setAddedLogs(LogData.errorFilterFn);
      setRemovedLogs(LogData.errorFilterFn);
    } else {
      setMsgs(comparer.last().summary.msgs);
      setHTTPCodes(comparer.last().summary.httpCodes);
      setJobs(comparer.last().summary.jobs);
      setPlugins(comparer.last().summary.plugins);
      setUnchangedLogs(comparer.unchanged);
      setAddedLogs(comparer.added);
      setRemovedLogs(comparer.removed);
    }

    handleFiltersChange();
  }

  function handleNewSearchTerm(isAddition: boolean) {
    if (isAddition) {
      setFilters("terms", filters.terms.length, {
        and: true,
        contains: true,
        field: "",
        value: "",
      });
      return;
    }

    setFilters("terms", filters.terms.slice(0, -1));
  }

  function handleSaveFilter() {
    // Remove logs from the filter to avoid saving the whole log file
    const filterStr = JSON.stringify({ ...filters, logs: [] });
    localStorage.setItem(savedFilterKey(savedFilterName()), filterStr);
  }

  function handleLoadFilter(filterName: string) {
    const filtersStr = localStorage.getItem(savedFilterKey(filterName));
    if (!filtersStr) return;

    setSavedFilterName(filterName);
    setFilters(JSON.parse(filtersStr));
    handleFiltersChange();
  }

  function handleDeleteFilters() {
    savedFiltersKeys().forEach((key) => localStorage.removeItem(key));
    setSavedFilterName("");
  }

  return {
    savedFilterName,
    filters,
    msgs,
    httpCodes,
    jobs,
    plugins,
    unchangedLogs,
    addedLogs,
    removedLogs,
    setFilters,
    setSavedFilterName,
    handleFiltersChange,
    handleLogsSelectionChanged,
    handleErrorsOnlyChange,
    handleResetClick,
    handleNewSearchTerm,
    handleSaveFilter,
    handleLoadFilter,
    handleDeleteFilters,
  };
}

export default useViewModel;
export { defaultFilters, savedFiltersNames, savedFilterKey };
export type { SearchTerm, FiltersData, FiltersProps, GridsRefs };
