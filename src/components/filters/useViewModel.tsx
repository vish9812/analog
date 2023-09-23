import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import LogsProcessor, { GroupedMsg } from "../../models/logsProcessor";
import { SelectionChangedEvent } from "ag-grid-community";
import { type AgGridSolidRef } from "ag-grid-solid";

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
  return { startTime: "", endTime: "", regex: "", msgs: [], errorsOnly: false };
}

function useViewModel(props: FiltersProps) {
  const [filters, setFilters] = createStore(defaultFilters());

  const [topMsgs, setTopMsgs] = createSignal(LogsProcessor.instance.topMsgs);

  function handleFiltersChange() {
    props.onFiltersChange(filters);
  }

  function handleResetClick(gridRef: AgGridSolidRef) {
    setFilters(defaultFilters());
    handleErrorsOnlyChange(null, false);
    gridRef.api.deselectAll();
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
      setTopMsgs((prev) => prev.filter((m) => m.hasErrors));
    } else {
      setTopMsgs(LogsProcessor.instance.topMsgs);
    }

    handleFiltersChange();
  }

  return {
    filters,
    topMsgs,
    setFilters,
    handleFiltersChange,
    handleSelectionChanged,
    handleErrorsOnlyChange,
    handleResetClick,
  };
}

export default useViewModel;
export type { FiltersData, FiltersProps };
