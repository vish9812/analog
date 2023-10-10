import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { GroupedMsg } from "../../models/processor";
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
  msgs: string[];
  errorsOnly: boolean;
}

function defaultFilters(): FiltersData {
  return {
    startTime: "",
    endTime: "",
    regex: "",
    msgs: [],
    errorsOnly: false,
  };
}

const errorFilterFn = (prev: GroupedMsg[]) => prev.filter((m) => m.hasErrors);

function useViewModel(props: FiltersProps) {
  const [filters, setFilters] = createStore(defaultFilters());
  const [topMsgs, setTopMsgs] = createSignal(comparer.last().topLogs);
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
    handleErrorsOnlyChange(null, false);
    topMsgsGridRef.api.deselectAll();
    if (addedMsgs().length > 0) {
      addedMsgsGridRef.api.deselectAll();
    }
  }

  function handleSelectionChanged(e: SelectionChangedEvent<GroupedMsg>) {
    setFilters(
      "msgs",
      e.api.getSelectedRows().map((n) => n.msg)
    );
    handleFiltersChange();
  }

  function handleErrorsOnlyChange(_: any, on: boolean) {
    setFilters("errorsOnly", on);

    if (on) {
      setTopMsgs(errorFilterFn);
      setAddedMsgs(errorFilterFn);
      setRemovedMsgs(errorFilterFn);
    } else {
      setTopMsgs(comparer.last().topLogs);
      setAddedMsgs(comparer.added);
      setRemovedMsgs(comparer.removed);
    }

    handleFiltersChange();
  }

  return {
    filters,
    topMsgs,
    addedMsgs,
    removedMsgs,
    setFilters,
    handleFiltersChange,
    handleSelectionChanged,
    handleErrorsOnlyChange,
    handleResetClick,
  };
}

export default useViewModel;
export type { FiltersData, FiltersProps };
