import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import type { GroupedMsg, JSONLogs } from "../../models/processor";
import { SelectionChangedEvent } from "ag-grid-community";
import { type AgGridSolidRef } from "ag-grid-solid";
import comparer from "../../models/comparer";

interface FiltersProps {
  onFiltersChange: (filters: FiltersData) => void;
}

interface FiltersData {
  startTime: string;
  endTime: string;
  regex: string;
  logs: JSONLogs;
  errorsOnly: boolean;
}

function defaultFilters(): FiltersData {
  return {
    startTime: "",
    endTime: "",
    regex: "",
    logs: [],
    errorsOnly: false,
  };
}

const errorFilterFn = (prev: GroupedMsg[]) => prev.filter((m) => m.hasErrors);

function useViewModel(props: FiltersProps) {
  const [filters, setFilters] = createStore(defaultFilters());
  const [topLogs, setTopLogs] = createSignal(comparer.last().topLogs);
  const [addedMsgs, setAddedMsgs] = createSignal(comparer.added);
  const [removedMsgs, setRemovedMsgs] = createSignal(comparer.removed);

  function handleFiltersChange() {
    props.onFiltersChange(filters);
  }

  function handleResetClick(
    topMsgsGridRef: AgGridSolidRef,
    addedMsgsGridRef: AgGridSolidRef
  ) {
    setFilters(defaultFilters());
    handleErrorsOnlyChange(false);
    topMsgsGridRef.api.deselectAll();
    if (addedMsgs().length > 0) {
      addedMsgsGridRef.api.deselectAll();
    }
  }

  function handleLogsSelectionChanged(e: SelectionChangedEvent<GroupedMsg>) {
    setFilters(
      "logs",
      e.api.getSelectedRows().flatMap((n) => n.logs)
    );
    handleFiltersChange();
  }

  function handleErrorsOnlyChange(checked: boolean) {
    setFilters("errorsOnly", checked);

    if (checked) {
      setTopLogs(errorFilterFn);
      setAddedMsgs(errorFilterFn);
      setRemovedMsgs(errorFilterFn);
    } else {
      setTopLogs(comparer.last().topLogs);
      setAddedMsgs(comparer.added);
      setRemovedMsgs(comparer.removed);
    }

    handleFiltersChange();
  }

  return {
    filters,
    topLogs,
    addedMsgs,
    removedMsgs,
    setFilters,
    handleFiltersChange,
    handleLogsSelectionChanged,
    handleErrorsOnlyChange,
    handleResetClick,
  };
}

export default useViewModel;
export type { FiltersData, FiltersProps };
