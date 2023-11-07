import {
  Button,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
} from "@suid/material";
import useViewModel, { SearchTerm, FiltersProps } from "./useViewModel";
import { AgGridSolidRef } from "ag-grid-solid";
import { GridOptions } from "ag-grid-community";
import { Accessor, For, Show } from "solid-js";
import { Select } from "@thisbeyond/solid-select";
import { IconButton } from "@suid/material";
import AddIcon from "@suid/icons-material/Add";
import RemoveIcon from "@suid/icons-material/Remove";
import comparer from "@al/services/comparer";
import { GroupedMsg } from "@al/models/logData";
import GroupedMsgGrid from "../groupedMsgGrid";

const texts = {
  and: "AND",
  or: "OR",
  contains: "Contains",
  notContains: "Not Contains",
};

function Filters(props: FiltersProps) {
  let topLogsGridRef = {} as AgGridSolidRef;
  let addedLogsGridRef = {} as AgGridSolidRef;
  let removedLogsGridRef = {} as AgGridSolidRef;

  let {
    filters,
    topLogs,
    addedLogs,
    removedLogs,
    setFilters,
    handleFiltersChange,
    handleLogsSelectionChanged,
    handleErrorsOnlyChange,
    handleResetClick,
    handleNewSearchTerm,
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
    rowData: addedLogs(),
  };

  const removedLogsGridOptions: GridOptions<GroupedMsg> = {
    ...commonGridOptions,
    rowData: removedLogs(),
    columnDefs: [
      { ...commonGridOptions.columnDefs![0], checkboxSelection: undefined },
      { ...commonGridOptions.columnDefs![1] },
    ],
    rowSelection: undefined,
    onSelectionChanged: undefined,
  };

  function handleEnterKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleFiltersChange();
    }
  }

  function getSimpleSearchHTML(term: SearchTerm, i: Accessor<number>) {
    return (
      <>
        <Select
          class="app-select"
          options={[texts.and, texts.or]}
          initialValue={term.and ? texts.and : texts.or}
          onChange={(val) => setFilters("terms", i(), "and", val === texts.and)}
        />
        <Select
          class="app-select"
          options={[texts.contains, texts.notContains]}
          initialValue={term.contains ? texts.contains : texts.notContains}
          onChange={(val) =>
            setFilters("terms", i(), "contains", val === texts.contains)
          }
        />
        <TextField
          label="value"
          value={term.value}
          onChange={(_, val) => setFilters("terms", i(), "value", val)}
          onKeyDown={handleEnterKey}
        />
      </>
    );
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
          <For each={filters.terms}>{getSimpleSearchHTML}</For>
          <IconButton color="primary" onClick={() => handleNewSearchTerm(true)}>
            <AddIcon />
          </IconButton>
          <IconButton
            color="warning"
            onClick={() => handleNewSearchTerm(false)}
          >
            <RemoveIcon />
          </IconButton>
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
            onClick={() => handleResetClick(topLogsGridRef, addedLogsGridRef)}
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
          <GroupedMsgGrid
            ref={topLogsGridRef}
            name="Top Logs"
            options={topLogsGridOptions}
          ></GroupedMsgGrid>
        </Grid>
        <Show when={comparer.isOn()}>
          <Grid item xs={8} container spacing={2}>
            <Grid item xs={6}>
              <GroupedMsgGrid
                ref={addedLogsGridRef}
                name="Added Logs"
                options={addedLogsGridOptions}
              ></GroupedMsgGrid>
            </Grid>
            <Grid item xs={6}>
              <GroupedMsgGrid
                ref={removedLogsGridRef}
                name="Removed Logs"
                options={removedLogsGridOptions}
              ></GroupedMsgGrid>
            </Grid>
          </Grid>
        </Show>
      </Grid>
    </Grid>
  );
}

export default Filters;
