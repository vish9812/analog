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

function useViewModel(props: FiltersProps) {
  const [filters, setFilters] = createStore(defaultFilters());
  const [msgs, setMsgs] = createSignal(comparer.last().summary.msgs);
  const [httpCodes, setHTTPCodes] = createSignal(
    comparer.last().summary.httpCodes
  );
  const [jobs, setJobs] = createSignal(comparer.last().summary.jobs);
  const [plugins, setPlugins] = createSignal(comparer.last().summary.plugins);
  const [addedLogs, setAddedLogs] = createSignal(comparer.added);
  const [removedLogs, setRemovedLogs] = createSignal(comparer.removed);

  function handleFiltersChange() {
    props.onFiltersChange(filters);
  }

  function handleResetClick(gridsRefs: GridsRefs) {
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
      setAddedLogs(LogData.errorFilterFn);
      setRemovedLogs(LogData.errorFilterFn);
    } else {
      setMsgs(comparer.last().summary.msgs);
      setHTTPCodes(comparer.last().summary.httpCodes);
      setJobs(comparer.last().summary.jobs);
      setPlugins(comparer.last().summary.plugins);
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

  return {
    filters,
    msgs,
    httpCodes,
    jobs,
    plugins,
    addedLogs,
    removedLogs,
    setFilters,
    handleFiltersChange,
    handleLogsSelectionChanged,
    handleErrorsOnlyChange,
    handleResetClick,
    handleNewSearchTerm,
  };
}

export default useViewModel;
export { defaultFilters };
export type { SearchTerm, FiltersData, FiltersProps, GridsRefs };
