import {
  Button,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
} from "@suid/material";
import useViewModel, {
  SearchTerm,
  FiltersProps,
  GridsRefs,
} from "./useViewModel";
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

interface GridsOptions {
  msgs: GridOptions<GroupedMsg>;
  httpCodes: GridOptions<GroupedMsg>;
  jobs: GridOptions<GroupedMsg>;
  plugins: GridOptions<GroupedMsg>;
  added: GridOptions<GroupedMsg>;
  removed: GridOptions<GroupedMsg>;
}

function Filters(props: FiltersProps) {
  const gridsRefs: GridsRefs = {
    msgs: {} as AgGridSolidRef,
    httpCodes: {} as AgGridSolidRef,
    jobs: {} as AgGridSolidRef,
    plugins: {} as AgGridSolidRef,
    added: {} as AgGridSolidRef,
    removed: {} as AgGridSolidRef,
  };

  const {
    filters,
    msgs,
    httpCodes,
    jobs,
    plugins,
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
        headerCheckboxSelection: true,
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
    onSelectionChanged: () => handleLogsSelectionChanged(gridsRefs),
    getRowStyle: (params) =>
      params.data?.hasErrors ? { background: "#FFBFBF" } : undefined,
  };

  const gridsOptions: GridsOptions = {
    msgs: { ...commonGridOptions, rowData: msgs() },
    jobs: { ...commonGridOptions, rowData: jobs() },
    plugins: { ...commonGridOptions, rowData: plugins() },
    added: { ...commonGridOptions, rowData: addedLogs() },
    httpCodes: {
      ...commonGridOptions,
      rowData: httpCodes(),
      columnDefs: [
        { ...commonGridOptions.columnDefs![0], flex: 1 },
        { ...commonGridOptions.columnDefs![1], flex: 1 },
      ],
    },
    removed: {
      ...commonGridOptions,
      rowData: removedLogs(),
      columnDefs: [
        { ...commonGridOptions.columnDefs![0], checkboxSelection: undefined },
        { ...commonGridOptions.columnDefs![1] },
      ],
      rowSelection: undefined,
      onSelectionChanged: undefined,
    },
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
          label="Search"
          value={term.value}
          onChange={(_, val) =>
            setFilters("terms", i(), "value", val.toLowerCase())
          }
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
            label="Start Time(Inclusive)"
            value={filters.startTime}
            onChange={(_, val) => setFilters("startTime", val)}
            onKeyDown={handleEnterKey}
          />
          <TextField
            label="End Time(Exclusive)"
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
            onClick={() => handleResetClick(gridsRefs)}
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
            ref={gridsRefs.msgs}
            name="Top Logs"
            options={gridsOptions.msgs}
          ></GroupedMsgGrid>
        </Grid>
        <Grid item xs={2}>
          <GroupedMsgGrid
            ref={gridsRefs.httpCodes}
            name="HTTP Codes"
            options={gridsOptions.httpCodes}
          ></GroupedMsgGrid>
        </Grid>
        <Grid item xs={3}>
          <GroupedMsgGrid
            ref={gridsRefs.jobs}
            name="Jobs"
            options={gridsOptions.jobs}
          ></GroupedMsgGrid>
        </Grid>
        <Grid item xs={3}>
          <GroupedMsgGrid
            ref={gridsRefs.plugins}
            name="Plugins"
            options={gridsOptions.plugins}
          ></GroupedMsgGrid>
        </Grid>
      </Grid>
      <Show when={comparer.isOn()}>
        <Grid item xs={12} container spacing={2}>
          <Grid item xs={6}>
            <GroupedMsgGrid
              ref={gridsRefs.added}
              name="Added Logs"
              options={gridsOptions.added}
            ></GroupedMsgGrid>
          </Grid>
          <Grid item xs={6}>
            <GroupedMsgGrid
              ref={gridsRefs.removed}
              name="Removed Logs"
              options={gridsOptions.removed}
            ></GroupedMsgGrid>
          </Grid>
        </Grid>
      </Show>
    </Grid>
  );
}

export default Filters;
