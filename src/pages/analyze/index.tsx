import AgGridSolid, { AgGridSolidRef } from "ag-grid-solid";
import { Grid, Button, Divider } from "@suid/material";
import useViewModel from "./useViewModel";
import gridService from "./gridService";
import { Select, createOptions } from "@thisbeyond/solid-select";
import { GridOptions } from "ag-grid-community";
import Filters from "@al/components/filters";
import comparer from "@al/services/comparer";
import LogData, { JSONLog } from "@al/models/logData";

function Analyzer() {
  let gridRef = {} as AgGridSolidRef;

  const {
    handleFiltersChange,
    handleColsChange,
    rows,
    cols,
    downloadSubset,
    initialCols,
    setInitialCols,
    timeJumps,
    handleTimeJump,
    handleContextClick,
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
    getRowId: (params) => params.data.id,
    getRowStyle: (params) =>
      params.data && LogData.isErrorLog(params.data)
        ? { background: "#FFBFBF" }
        : undefined,
  });

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} margin={2}>
        <Filters onFiltersChange={handleFiltersChange}></Filters>
      </Grid>
      <Grid item xs={12}>
        <Divider></Divider>
      </Grid>
      <Grid item xs={12} container spacing={2}>
        <Grid item xs={5} container spacing={2} sx={{ alignItems: "center" }}>
          <Grid item xs={6}>
            <h3>
              All Logs
              {rows().length ? " : " + rows().length.toLocaleString() : ""}
            </h3>
          </Grid>
          <Grid item xs={6}>
            <Button
              sx={{ margin: 2 }}
              variant="outlined"
              onClick={downloadSubset}
            >
              Download the subset
            </Button>
          </Grid>
        </Grid>
        <Grid item xs={2}>
          <Button
            variant="outlined"
            disabled={timeJumps().prevDisabled}
            onClick={() => handleTimeJump(gridRef, false)}
          >
            {"<<"}
          </Button>
          Time Jumps
          <Button
            variant="outlined"
            disabled={timeJumps().nextDisabled}
            onClick={() => handleTimeJump(gridRef, true)}
          >
            {">>"}
          </Button>
        </Grid>
        <Grid item xs={5} container spacing={2} sx={{ alignItems: "center" }}>
          <Grid item xs={8}>
            <Select
              class="app-select"
              multiple
              initialValue={initialCols().map((c) => c.field)}
              {...createOptions(comparer.last().keys)}
              onChange={handleColsChange}
            />
          </Grid>
          <Grid item xs={4}>
            <Button
              sx={{ margin: 2 }}
              variant="outlined"
              onClick={() => setInitialCols(gridService.defaultCols())}
            >
              Reset Fields
            </Button>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <div style={{ height: "900px" }} class="ag-theme-alpine">
            <AgGridSolid ref={gridRef} {...gridOptions()} />
          </div>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default Analyzer;
