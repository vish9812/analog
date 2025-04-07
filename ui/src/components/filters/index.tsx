import { Accessor, For, Show } from "solid-js";
import { Select, createOptions } from "@thisbeyond/solid-select";
import useViewModel, {
  SearchTerm,
  FiltersProps,
  GridsRefs,
  savedFiltersNames,
} from "./useViewModel";
import { AgGridSolidRef } from "ag-grid-solid";
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
      params.data?.hasErrors ? { background: "#FFBFBF" } : undefined,
  };

  const gridsOptions: GridsOptions = {
    msgs: { ...commonGridOptions, rowData: msgs() },
    jobs: { ...commonGridOptions, rowData: jobs() },
    plugins: { ...commonGridOptions, rowData: plugins() },
    unchanged: { ...commonGridOptions, rowData: unchangedLogs() },
    added: { ...commonGridOptions, rowData: addedLogs() },
    httpCodes: {
      ...commonGridOptions,
      rowData: httpCodes(),
      columnDefs: [
        { ...commonGridOptions.columnDefs![0], flex: 1 },
        { ...commonGridOptions.columnDefs![1], flex: 1 },
      ],
    },
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
          class="select select-bordered select-sm w-24"
          value={term.and ? texts.and : texts.or}
          onChange={(e) =>
            setFilters("terms", i(), "and", e.currentTarget.value === texts.and)
          }
        >
          <option>{texts.and}</option>
          <option>{texts.or}</option>
        </select>

        <select
          class="select select-bordered select-sm w-32"
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
          initialValue={texts.allFields}
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
          class="input input-bordered input-sm w-full"
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
          class="btn btn-circle btn-sm btn-error"
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
      <div class="card bg-base-200">
        <div class="card-body p-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Start Time (Inclusive)</span>
              </label>
              <input
                type="text"
                placeholder="YYYY-MM-DD HH:mm:ss"
                class="input input-bordered input-sm"
                value={filters.startTime}
                onInput={(e) => setFilters("startTime", e.currentTarget.value)}
                onKeyDown={handleFiltersEnterKey}
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">End Time (Exclusive)</span>
              </label>
              <input
                type="text"
                placeholder="YYYY-MM-DD HH:mm:ss"
                class="input input-bordered input-sm"
                value={filters.endTime}
                onInput={(e) => setFilters("endTime", e.currentTarget.value)}
                onKeyDown={handleFiltersEnterKey}
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Regex Search</span>
              </label>
              <input
                type="text"
                placeholder="Enter regex pattern"
                class="input input-bordered input-sm"
                value={filters.regex}
                onInput={(e) => setFilters("regex", e.currentTarget.value)}
                onKeyDown={handleFiltersEnterKey}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search Terms */}
      <div class="card bg-base-200">
        <div class="card-body p-4">
          <div class="space-y-2">
            <For each={filters.terms}>{getSimpleSearchHTML}</For>

            <button
              class="btn btn-primary btn-sm"
              onClick={() => handleNewSearchTerm(true)}
            >
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
              Add Filter
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div class="card bg-base-200">
        <div class="card-body p-4">
          <div class="flex flex-wrap gap-6 items-end">
            {/* Main Controls */}
            <div class="flex gap-4 items-center">
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text mr-2">Errors Only</span>
                  <input
                    type="checkbox"
                    class="toggle toggle-error"
                    checked={filters.errorsOnly}
                    onChange={(e) =>
                      handleErrorsOnlyChange(e.currentTarget.checked)
                    }
                  />
                </label>
              </div>

              <div class="flex gap-2">
                <button
                  class="btn btn-primary btn-sm"
                  onClick={handleFiltersChange}
                >
                  Filter
                </button>
                <button
                  class="btn btn-ghost btn-sm"
                  onClick={() => handleResetClick(gridsRefs)}
                >
                  Reset
                </button>
              </div>
            </div>

            <div class="divider divider-horizontal"></div>
            {/* N-Logs Controls */}
            <div class="flex gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">First N Logs</span>
                </label>
                <input
                  type="number"
                  class="input input-bordered input-sm w-24"
                  value={filters.firstN}
                  onInput={(e) =>
                    setFilters(
                      "firstN",
                      isNaN(+e.currentTarget.value) ||
                        +e.currentTarget.value < 0
                        ? 0
                        : +e.currentTarget.value
                    )
                  }
                  onKeyDown={handleNLogsKeyDown}
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Last N Logs</span>
                </label>
                <input
                  type="number"
                  class="input input-bordered input-sm w-24"
                  value={filters.lastN}
                  onInput={(e) =>
                    setFilters(
                      "lastN",
                      isNaN(+e.currentTarget.value) ||
                        +e.currentTarget.value < 0
                        ? 0
                        : +e.currentTarget.value
                    )
                  }
                  onKeyDown={handleNLogsKeyDown}
                />
              </div>
            </div>

            <div class="divider divider-horizontal"></div>

            {/* Filter Management */}
            <div class="flex gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Filter Name</span>
                </label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-48"
                  value={savedFilterName()}
                  onInput={(e) => setSavedFilterName(e.currentTarget.value)}
                />
              </div>

              <div class="flex gap-2 items-end">
                <button
                  class="btn btn-primary btn-sm"
                  onClick={handleSaveFilter}
                >
                  Save Filters
                </button>

                <Select
                  class="app-select w-50"
                  {...createOptions(savedFiltersNames())}
                  onChange={handleLoadFilter}
                />

                <button
                  class="btn btn-error btn-sm"
                  onClick={handleDeleteFilters}
                >
                  Delete Filters
                </button>
              </div>
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
      <Show when={!comparer.isOn()}>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </Show>
    </div>
  );
}

export default Filters;
