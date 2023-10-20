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
import type { RowClassParams, RowStyle } from "ag-grid-community";
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

  function getRowStyle(
    params: RowClassParams<GroupedMsg>
  ): RowStyle | undefined {
    return params.data?.hasErrors
      ? { background: "red", color: "white" }
      : undefined;
  }

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
            <AgGridSolid
              ref={topMsgsGridRef}
              enableCellTextSelection={true}
              rowData={topLogs()}
              columnDefs={[
                {
                  field: "msg",
                  flex: 2,
                  checkboxSelection: true,
                  filter: "agTextColumnFilter",
                },
                { field: "count", flex: 0.5, sortable: true },
              ]}
              rowSelection="multiple"
              suppressRowClickSelection={true}
              onSelectionChanged={handleLogsSelectionChanged}
              getRowStyle={getRowStyle}
            />
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
                <AgGridSolid
                  ref={addedMsgsGridRef}
                  enableCellTextSelection={true}
                  rowData={addedMsgs()}
                  columnDefs={[
                    {
                      field: "msg",
                      flex: 2,
                      checkboxSelection: true,
                      filter: "agTextColumnFilter",
                    },
                    { field: "count", flex: 1, sortable: true },
                  ]}
                  rowSelection="multiple"
                  suppressRowClickSelection={true}
                  onSelectionChanged={handleLogsSelectionChanged}
                  getRowStyle={getRowStyle}
                />
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
                <AgGridSolid
                  ref={removedMsgs}
                  enableCellTextSelection={true}
                  rowData={removedMsgs()}
                  columnDefs={[
                    {
                      field: "msg",
                      flex: 2,
                      filter: "agTextColumnFilter",
                    },
                    { field: "count", flex: 1, sortable: true },
                  ]}
                  suppressRowClickSelection={true}
                  getRowStyle={getRowStyle}
                />
              </div>
            </Grid>
          </Grid>
        </Show>
      </Grid>
    </Grid>
  );
}

export default Filters;
