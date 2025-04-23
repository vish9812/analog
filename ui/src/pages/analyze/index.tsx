import AgGridSolid, { AgGridSolidRef } from "solid-ag-grid";
import useViewModel from "./useViewModel";
import gridService from "./gridService";
import { Select, createOptions } from "@thisbeyond/solid-select";
import { GridOptions, RowClassParams } from "ag-grid-community";
import Filters from "@al/components/filters";
import comparer from "@al/services/comparer";
import LogData, { JSONLog } from "@al/models/logData";
import Download from "@al/components/download";
import TimeJumps from "@al/components/timeJumps";

function Analyze() {
  let gridRef = {} as AgGridSolidRef;

  const {
    handleFiltersChange,
    handleColsChange,
    rows,
    cols,
    initialCols,
    setInitialCols,
    handleTimeJump,
    handleContextClick,
    filterErrorsOnly,
  } = useViewModel();

  const gridOptions = (): GridOptions<JSONLog> => ({
    enableCellTextSelection: true,
    suppressMaintainUnsortedOrder: true,
    rowBuffer: 50,
    defaultColDef: gridService.defaultColDef,
    context: {
      handleContextClick,
    },
    rowData: rows(),
    columnDefs: cols(),
    getRowId: (params: { data: JSONLog }) => params.data[LogData.logKeys.id],
    getRowStyle: (params: RowClassParams<JSONLog>) =>
      params.data && LogData.isErrorLog(params.data)
        ? { background: "#E6A5A5" }
        : undefined,
  });

  return (
    <div class="px-4 space-y-6">
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow-xl">
          <div class="p-0">
            <div class="relative">
              <input
                type="checkbox"
                class="peer absolute inset-x-0 top-0 z-10 h-12 w-full cursor-pointer opacity-0"
              />
              <div class="text-xl font-semibold h-12 flex items-center px-4">
                Filters
              </div>
              <div class="max-h-0 peer-checked:max-h-screen transition-all duration-200 overflow-hidden">
                <div class="p-4">
                  <Filters onFiltersChange={handleFiltersChange} />
                </div>
              </div>
              <div class="absolute top-3 right-3 transition-transform duration-200 rotate-0 peer-checked:rotate-180">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-xl">
          <div class="p-6">
            <div class="flex flex-wrap gap-4 items-center justify-between mb-4">
              <div class="flex items-center gap-4">
                <h2 class="text-xl font-semibold flex items-center gap-2">
                  All Logs
                  {rows().length ? (
                    <span class="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-800">
                      {rows().length.toLocaleString()}
                    </span>
                  ) : null}
                </h2>
                <Download logs={rows} />
              </div>

              <TimeJumps
                onTimeJump={(jumpID) => handleTimeJump(gridRef, jumpID)}
              />

              <div class="flex items-center gap-2">
                <Select
                  class="app-select min-w-[200px]"
                  multiple
                  initialValue={initialCols().map((c) => c.field)}
                  {...createOptions(comparer.last().keys)}
                  onChange={handleColsChange}
                />
                <button
                  class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 gap-2"
                  onClick={() => setInitialCols(gridService.defaultCols())}
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reset Fields
                </button>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 overflow-hidden shadow-inner">
              <div class="ag-theme-alpine h-[900px]">
                <AgGridSolid ref={gridRef} {...gridOptions()} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analyze;
