import { Accessor, For, Show } from "solid-js";
import { Select, createOptions } from "@thisbeyond/solid-select";
import useViewModel, {
  SearchTerm,
  FiltersProps,
  GridsRefs,
  savedFiltersNames,
} from "./useViewModel";
import { AgGridSolidRef } from "solid-ag-grid";
import { GridOptions } from "ag-grid-community";
import comparer from "@al/services/comparer";
import { GroupedMsg } from "@al/models/logData";
import GroupedMsgGrid from "../groupedMsgGrid";
import timesUtils from "@al/utils/times";

const texts = {
  and: "AND",
  or: "OR",
  contains: "Contains",
  notContains: "Not Contains",
  allFields: "All Fields",
};

interface GridsOptions {
  msgs: GridOptions<GroupedMsg>;
  httpCodes: GridOptions<GroupedMsg>;
  jobs: GridOptions<GroupedMsg>;
  plugins: GridOptions<GroupedMsg>;
  unchanged: GridOptions<GroupedMsg>;
  added: GridOptions<GroupedMsg>;
  removed: GridOptions<GroupedMsg>;
}

function Filters(props: FiltersProps) {
  const gridsRefs: GridsRefs = {
    msgs: {} as AgGridSolidRef,
    httpCodes: {} as AgGridSolidRef,
    jobs: {} as AgGridSolidRef,
    plugins: {} as AgGridSolidRef,
    unchanged: {} as AgGridSolidRef,
    added: {} as AgGridSolidRef,
    removed: {} as AgGridSolidRef,
  };

  const {
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
  } = useViewModel(props);

  const commonGridOptions: GridOptions<GroupedMsg> = {
    enableCellTextSelection: true,
    columnDefs: [
      {
        field: "msg",
        flex: 2,
        headerCheckboxSelection: true,
        checkboxSelection: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "count",
        flex: 0.5,
        sortable: true,
        valueGetter: (params) => params.data?.logs.length,
      },
    ],
    rowSelection: "multiple",
    suppressRowClickSelection: true,
    onSelectionChanged: () => handleLogsSelectionChanged(gridsRefs),
    getRowStyle: (params) =>
      params.data?.hasErrors ? { background: "#E6A5A5" } : undefined,
  };

  const gridsOptions: GridsOptions = {
    msgs: { ...commonGridOptions, rowData: msgs() },
    jobs: { ...commonGridOptions, rowData: jobs() },
    plugins: { ...commonGridOptions, rowData: plugins() },
    unchanged: { ...commonGridOptions, rowData: unchangedLogs() },
    added: { ...commonGridOptions, rowData: addedLogs() },
    httpCodes: { ...commonGridOptions, rowData: httpCodes() },
    removed: {
      ...commonGridOptions,
      rowData: removedLogs(),
      columnDefs: [
        { ...commonGridOptions.columnDefs![0], checkboxSelection: undefined },
        { ...commonGridOptions.columnDefs![1] },
      ],
      rowSelection: undefined,
      onSelectionChanged: undefined,
    },
  };

  function handleFiltersEnterKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleFiltersChange();
    }
  }

  function handleNLogsKeyDown(e: KeyboardEvent) {
    timesUtils.debounce(handleLogsSelectionChanged, 600)(gridsRefs);
  }

  function getSimpleSearchHTML(term: SearchTerm, i: Accessor<number>) {
    return (
      <div class="flex gap-2 items-center">
        <select
          class="input-base w-24"
          value={term.and ? texts.and : texts.or}
          onChange={(e) =>
            setFilters("terms", i(), "and", e.currentTarget.value === texts.and)
          }
        >
          <option>{texts.and}</option>
          <option>{texts.or}</option>
        </select>

        <select
          class="input-base w-32"
          value={term.contains ? texts.contains : texts.notContains}
          onChange={(e) =>
            setFilters(
              "terms",
              i(),
              "contains",
              e.currentTarget.value === texts.contains
            )
          }
        >
          <option>{texts.contains}</option>
          <option>{texts.notContains}</option>
        </select>

        <Select
          class="app-select w-100"
          initialValue={term.field === "" ? texts.allFields : term.field}
          {...createOptions([texts.allFields, ...comparer.last().keys])}
          onChange={(val) =>
            setFilters(
              "terms",
              i(),
              "field",
              val === texts.allFields ? "" : val
            )
          }
        />

        <input
          type="text"
          placeholder="Search"
          class="input-base"
          value={term.value}
          onInput={(e) =>
            setFilters(
              "terms",
              i(),
              "value",
              e.currentTarget.value.toLowerCase()
            )
          }
          onKeyDown={handleFiltersEnterKey}
        />

        <button
          class="btn-error p-1.5 rounded-full"
          onClick={() => handleNewSearchTerm(false)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div class="p-4 space-y-6">
      {/* Time and Regex Search */}
      <div class="card-base">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="label-base">Start Time (Inclusive)</label>
            <input
              type="text"
              placeholder="YYYY-MM-DD HH:mm:ss"
              class="input-base"
              value={filters.startTime}
              onInput={(e) => setFilters("startTime", e.currentTarget.value)}
              onKeyDown={handleFiltersEnterKey}
            />
          </div>

          <div>
            <label class="label-base">End Time (Exclusive)</label>
            <input
              type="text"
              placeholder="YYYY-MM-DD HH:mm:ss"
              class="input-base"
              value={filters.endTime}
              onInput={(e) => setFilters("endTime", e.currentTarget.value)}
              onKeyDown={handleFiltersEnterKey}
            />
          </div>

          <div>
            <label class="label-base">Regex Search</label>
            <input
              type="text"
              placeholder="Enter regex pattern"
              class="input-base"
              value={filters.regex}
              onInput={(e) => setFilters("regex", e.currentTarget.value)}
              onKeyDown={handleFiltersEnterKey}
            />
          </div>
        </div>
      </div>

      {/* Search Terms */}
      <div class="card-base">
        <div class="space-y-2">
          <For each={filters.terms}>{getSimpleSearchHTML}</For>

          <button class="btn-primary" onClick={() => handleNewSearchTerm(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div class="card-base">
        <div class="flex flex-wrap gap-6 items-end">
          {/* Main Controls */}
          <div class="flex gap-4 items-center">
            <div>
              <label class="inline-flex items-center cursor-pointer">
                <span class="text-sm font-medium text-gray-700 mr-2">
                  Errors Only
                </span>
                <div class="relative">
                  <input
                    type="checkbox"
                    class="sr-only peer"
                    checked={filters.errorsOnly}
                    onChange={(e) =>
                      handleErrorsOnlyChange(e.currentTarget.checked)
                    }
                  />
                  <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-red-500 peer-focus:ring-2 peer-focus:ring-red-300"></div>
                  <div class="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full transition-all peer-checked:translate-x-full"></div>
                </div>
              </label>
            </div>

            <div class="flex gap-2">
              <button class="btn-primary" onClick={handleFiltersChange}>
                Filter
              </button>
              <button
                class="btn-error"
                onClick={() => handleResetClick(gridsRefs)}
              >
                Reset
              </button>
            </div>
          </div>

          <div class="h-8 w-px bg-gray-300"></div>

          {/* N-Logs Controls */}
          <div class="flex gap-4">
            <div class="relative group">
              <label class="label-base">
                <span>First N Logs</span>
                <div class="tooltip-base">
                  Deduplicate logs leaving only the First N occurrences. It
                  works with the below table filters only.
                </div>
              </label>
              <input
                type="number"
                class="input-base w-24"
                value={filters.firstN}
                onInput={(e) =>
                  setFilters(
                    "firstN",
                    isNaN(+e.currentTarget.value) || +e.currentTarget.value < 0
                      ? 0
                      : +e.currentTarget.value
                  )
                }
                onKeyDown={handleNLogsKeyDown}
              />
            </div>

            <div class="relative group">
              <label class="label-base">
                <span>Last N Logs</span>
                <div class="tooltip-base">
                  Deduplicate logs leaving only the Last N occurrences. It works
                  with the below table filters only.
                </div>
              </label>
              <input
                type="number"
                class="input-base w-24"
                value={filters.lastN}
                onInput={(e) =>
                  setFilters(
                    "lastN",
                    isNaN(+e.currentTarget.value) || +e.currentTarget.value < 0
                      ? 0
                      : +e.currentTarget.value
                  )
                }
                onKeyDown={handleNLogsKeyDown}
              />
            </div>
          </div>

          <div class="h-8 w-px bg-gray-300"></div>

          {/* Filter Management */}
          <div class="flex gap-4">
            <div>
              <label class="label-base">Filter Name</label>
              <input
                type="text"
                class="input-base w-48"
                value={savedFilterName()}
                onInput={(e) => setSavedFilterName(e.currentTarget.value)}
              />
            </div>

            <div class="flex gap-2 items-end">
              <button class="btn-outline-primary" onClick={handleSaveFilter}>
                Save Filters
              </button>

              <Select
                class="app-select w-50"
                {...createOptions(savedFiltersNames())}
                onChange={handleLoadFilter}
              />

              <button class="btn-outline-error" onClick={handleDeleteFilters}>
                Delete All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grids */}
      <Show when={comparer.isOn()}>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <GroupedMsgGrid
            name="Unchanged"
            ref={gridsRefs.unchanged}
            options={gridsOptions.unchanged}
          />
          <GroupedMsgGrid
            name="Added"
            ref={gridsRefs.added}
            options={gridsOptions.added}
          />
          <GroupedMsgGrid
            name="Removed"
            ref={gridsRefs.removed}
            options={gridsOptions.removed}
          />
        </div>
      </Show>
      <div class="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-4 gap-4">
        <GroupedMsgGrid
          name="Top Logs"
          ref={gridsRefs.msgs}
          options={gridsOptions.msgs}
        />
        <GroupedMsgGrid
          name="HTTP Codes"
          ref={gridsRefs.httpCodes}
          options={gridsOptions.httpCodes}
        />
        <GroupedMsgGrid
          name="Jobs"
          ref={gridsRefs.jobs}
          options={gridsOptions.jobs}
        />
        <GroupedMsgGrid
          name="Plugins"
          ref={gridsRefs.plugins}
          options={gridsOptions.plugins}
        />
      </div>
    </div>
  );
}

export default Filters;
