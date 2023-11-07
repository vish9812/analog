import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { SelectionChangedEvent } from "ag-grid-community";
import { AgGridSolidRef } from "ag-grid-solid";
import comparer from "@al/services/comparer";
import { JSONLogs, GroupedMsg } from "@al/models/logData";

interface FiltersProps {
  onFiltersChange: (filters: FiltersData) => void;
}

interface SearchTerm {
  and: boolean;
  contains: boolean;
  value: string;
}

interface FiltersData {
  startTime: string;
  endTime: string;
  regex: string;
  terms: SearchTerm[];
  logs: JSONLogs;
  errorsOnly: boolean;
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
        value: "",
      },
    ],
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

  function handleNewSearchTerm(isAddition: boolean) {
    if (isAddition) {
      setFilters("terms", filters.terms.length, {
        and: true,
        contains: true,
        value: "",
      });
      return;
    }

    setFilters("terms", filters.terms.slice(0, -1));
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
    handleNewSearchTerm,
  };
}

export default useViewModel;
export type { SearchTerm, FiltersData, FiltersProps };
