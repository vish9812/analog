import {
  Button,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
} from "@suid/material";
import useViewModel, { type FiltersProps } from "./useViewModel";
import AgGridSolid, { type AgGridSolidRef } from "ag-grid-solid";
import { RowClassParams } from "ag-grid-community";
import { GroupedMsg } from "../../models/logsProcessor";

function Filters(props: FiltersProps) {
  let gridRef = {} as AgGridSolidRef;

  let {
    filters,
    topMsgs,
    setFilters,
    handleFiltersChange,
    handleSelectionChanged,
    handleErrorsOnlyChange,
    handleResetClick,
  } = useViewModel(props);

  const getRowStyle = (params: RowClassParams<GroupedMsg>) => {
    if (params.data?.hasErrors) {
      return { background: "orange" };
    }
  };

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
          <Button variant="outlined" onClick={() => handleResetClick(gridRef)}>
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
      <Grid item xs={12}>
        <div style={{ height: "350px" }} class="ag-theme-material">
          <AgGridSolid
            ref={gridRef}
            rowData={topMsgs()}
            columnDefs={[
              {
                field: "msg",
                width: 500,
                checkboxSelection: true,
                filter: "agTextColumnFilter",
              },
              { field: "count", width: 250, sortable: true },
            ]}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            onSelectionChanged={handleSelectionChanged}
            getRowStyle={getRowStyle}
          />
        </div>
      </Grid>
    </Grid>
  );
}

export default Filters;
