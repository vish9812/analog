import {
  Button,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@suid/material";
import useViewModel, { type FiltersProps } from "./useViewModel";
import AgGridSolid, { type AgGridSolidRef } from "ag-grid-solid";
import type { GridOptions } from "ag-grid-community";
import { GroupedMsg } from "../../models/processor";
import { Show } from "solid-js";
import comparer from "../../models/comparer";

function Filters(props: FiltersProps) {
  let topMsgsGridRef = {} as AgGridSolidRef;
  let addedMsgsGridRef = {} as AgGridSolidRef;

  let {
    filters,
    topLogs,
    addedMsgs,
    removedMsgs,
    setFilters,
    handleFiltersChange,
    handleLogsSelectionChanged,
    handleErrorsOnlyChange,
    handleResetClick,
  } = useViewModel(props);

  const commonGridOptions: GridOptions<GroupedMsg> = {
    enableCellTextSelection: true,
    columnDefs: [
      {
        field: "msg",
        flex: 2,
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
    onSelectionChanged: handleLogsSelectionChanged,
    getRowStyle: (params) =>
      params.data?.hasErrors ? { background: "#FFBFBF" } : undefined,
  };

  const topLogsGridOptions: GridOptions<GroupedMsg> = {
    ...commonGridOptions,
    rowData: topLogs(),
  };

  const addedLogsGridOptions: GridOptions<GroupedMsg> = {
    ...commonGridOptions,
    rowData: addedMsgs(),
  };

  const removedLogsGridOptions: GridOptions<GroupedMsg> = {
    ...commonGridOptions,
    rowData: removedMsgs(),
    columnDefs: [
      { ...commonGridOptions.columnDefs![0], checkboxSelection: undefined },
      { ...commonGridOptions.columnDefs![1] },
    ],
    rowSelection: undefined,
  };

  function handleEnterKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleFiltersChange();
    }
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Start Time"
            value={filters.startTime}
            onChange={(_, val) => setFilters("startTime", val)}
            onKeyDown={handleEnterKey}
          />
          <TextField
            label="End Time"
            value={filters.endTime}
            onChange={(_, val) => setFilters("endTime", val)}
            onKeyDown={handleEnterKey}
          />
          <TextField
            label="Regex Search"
            value={filters.regex}
            onChange={(_, val) => setFilters("regex", val)}
            onKeyDown={handleEnterKey}
          />
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={handleFiltersChange}>
            Filter
          </Button>
          <Divider orientation="vertical" flexItem></Divider>
          <Button
            variant="outlined"
            onClick={() => handleResetClick(topMsgsGridRef, addedMsgsGridRef)}
          >
            Reset
          </Button>
          <Divider orientation="vertical" flexItem></Divider>
          <FormControlLabel
            value="errors"
            control={
              <Switch
                checked={filters.errorsOnly}
                onChange={(_, checked) => handleErrorsOnlyChange(checked)}
              />
            }
            label="Errors Only"
            labelPlacement="start"
          />
        </Stack>
      </Grid>
      <Grid item xs={12} container spacing={2}>
        <Grid item xs={4}>
          <Typography variant="h4" margin={2}>
            Top Logs
            {topLogs().length ? " : " + topLogs().length.toLocaleString() : ""}
          </Typography>
          <div style={{ height: "350px" }} class="ag-theme-alpine">
            <AgGridSolid ref={topMsgsGridRef} {...topLogsGridOptions} />
          </div>
        </Grid>
        <Show when={comparer.isOn()}>
          <Grid item xs={8} container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="h4" margin={2}>
                Added Logs
                {addedMsgs().length
                  ? " : " + addedMsgs().length.toLocaleString()
                  : ""}
              </Typography>
              <div style={{ height: "350px" }} class="ag-theme-alpine">
                <AgGridSolid ref={addedMsgsGridRef} {...addedLogsGridOptions} />
              </div>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h4" margin={2}>
                Removed Logs
                {removedMsgs().length
                  ? " : " + removedMsgs().length.toLocaleString()
                  : ""}
              </Typography>
              <div style={{ height: "350px" }} class="ag-theme-alpine">
                <AgGridSolid {...removedLogsGridOptions} />
              </div>
            </Grid>
          </Grid>
        </Show>
      </Grid>
    </Grid>
  );
}

export default Filters;
