import AgGridSolid, { AgGridSolidRef } from "ag-grid-solid";
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
    defaultColDef: gridService.defaultColDef,
    context: {
      handleContextClick,
    },
    rowData: rows(),
    columnDefs: cols(),
    getRowId: (params: { data: JSONLog }) => params.data[LogData.logKeys.id],
    getRowStyle: (params: RowClassParams<JSONLog>) =>
      params.data && LogData.isErrorLog(params.data) && !filterErrorsOnly()
        ? { background: "#E6A5A5" }
        : undefined,
  });

  return (
    <div class="px-4 space-y-6">
      <div class="space-y-6">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body p-0">
            <div class="collapse collapse-arrow peer-checked:collapse-open">
              <input type="checkbox" class="peer" />
              <div class="collapse-title text-xl font-semibold">Filters</div>
              <div class="collapse-content p-4">
                <Filters onFiltersChange={handleFiltersChange} />
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex flex-wrap gap-4 items-center justify-between mb-4">
              <div class="flex items-center gap-4">
                <h2 class="text-xl font-semibold flex items-center gap-2">
                  All Logs
                  {rows().length ? (
                    <span class="badge badge-primary badge-lg">
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
                  class="btn btn-outline btn-sm gap-2"
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

            <div class="rounded-lg border border-base-300 overflow-hidden shadow-inner">
              <div style={{ height: "900px" }} class="ag-theme-alpine">
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
