import "@thisbeyond/solid-select/style.css";
import AgGridSolid, { type AgGridSolidRef } from "ag-grid-solid";
import { Grid, Button, Typography, Divider, Stack } from "@suid/material";
import useViewModel from "./useViewModel";
import DataDialog from "../components/dataDialog";
import Filters from "../components/filters";
import gridService from "./gridService";
import { Show } from "solid-js";
import comparer from "../models/comparer";
import { Select, createOptions } from "@thisbeyond/solid-select";

function Analyzer() {
  let gridRef = {} as AgGridSolidRef;

  const {
    handleCellDoubleClick,
    handleFiltersChange,
    handleColsChange,
    rows,
    cols,
    viewData,
    selectedCellData,
    closeDialog,
    downloadSubset,
    initialCols,
    setInitialCols,
    timeJumps,
    handleTimeJump,
  } = useViewModel();

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
          <div style={{ height: "550px" }} class="ag-theme-alpine">
            <AgGridSolid
              ref={gridRef}
              defaultColDef={gridService.defaultColDef}
              rowData={rows()}
              columnDefs={cols()}
              onCellDoubleClicked={handleCellDoubleClick}
              getRowId={(params) => params.data.id}
            />
          </div>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Show when={viewData()}>
          <DataDialog
            data={selectedCellData()}
            open={viewData()}
            onClose={closeDialog}
          ></DataDialog>
        </Show>
      </Grid>
    </Grid>
  );
}

export default Analyzer;
