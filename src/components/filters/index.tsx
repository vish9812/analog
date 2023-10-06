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
  let removedMsgsGridRef = {} as AgGridSolidRef;

  let {
    filters,
    topMsgs,
    addedMsgs,
    removedMsgs,
    setFilters,
    handleFiltersChange,
    handleSelectionChanged,
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

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Start Time"
            value={filters.startTime}
            onChange={(_, val) => setFilters("startTime", val)}
          />
          <TextField
            label="End Time"
            value={filters.endTime}
            onChange={(_, val) => setFilters("endTime", val)}
          />
          <TextField
            label="Regex Search"
            value={filters.regex}
            onChange={(_, val) => setFilters("regex", val)}
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
            onClick={() =>
              handleResetClick(
                topMsgsGridRef,
                addedMsgsGridRef,
                removedMsgsGridRef
              )
            }
          >
            Reset
          </Button>
          <Divider orientation="vertical" flexItem></Divider>
          <FormControlLabel
            value="errors"
            control={
              <Switch
                checked={filters.errorsOnly}
                onChange={handleErrorsOnlyChange}
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
            {topMsgs().length ? " : " + topMsgs().length.toLocaleString() : ""}
          </Typography>
          <div style={{ height: "350px" }} class="ag-theme-alpine">
            <AgGridSolid
              ref={topMsgsGridRef}
              rowData={topMsgs()}
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
              onSelectionChanged={handleSelectionChanged}
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
                  onSelectionChanged={handleSelectionChanged}
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
                  rowData={removedMsgs()}
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
                  onSelectionChanged={handleSelectionChanged}
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
