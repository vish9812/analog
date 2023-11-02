import AgGridSolid, { type AgGridSolidRef } from "ag-grid-solid";
import { Grid, Button, Typography, Divider } from "@suid/material";
import useViewModel from "./useViewModel";
import Filters from "../components/filters";
import gridService from "./gridService";
import comparer from "../models/comparer";
import { Select, createOptions } from "@thisbeyond/solid-select";
import type { RowStyle, RowClassParams } from "ag-grid-community";
import Processor, { type JSONLog } from "../models/processor";

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
  } = useViewModel();

  function getRowStyle(params: RowClassParams<JSONLog>): RowStyle | undefined {
    return params.data && Processor.isErrorLog(params.data)
      ? { background: "#FFBFBF" }
      : undefined;
  }

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
            <Typography variant="h4" margin={2}>
              All Logs
              {rows().length ? " : " + rows().length.toLocaleString() : ""}
            </Typography>
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
          <div style={{ height: "750px" }} class="ag-theme-alpine">
            <AgGridSolid
              ref={gridRef}
              defaultColDef={gridService.defaultColDef}
              rowData={rows()}
              columnDefs={cols()}
              getRowId={(params) => params.data.id}
              getRowStyle={getRowStyle}
              enableCellTextSelection={true}
            />
          </div>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default Analyzer;
