import {
  Alert,
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
  savedFilterKeys,
} from "./useViewModel";
import { AgGridSolidRef } from "ag-grid-solid";
import { GridOptions } from "ag-grid-community";
import { Accessor, For, Show } from "solid-js";
import { Select, createOptions } from "@thisbeyond/solid-select";
import { IconButton } from "@suid/material";
import AddIcon from "@suid/icons-material/Add";
import RemoveIcon from "@suid/icons-material/Remove";
import comparer from "@al/services/comparer";
import { GroupedMsg } from "@al/models/logData";
import GroupedMsgGrid from "../groupedMsgGrid";
import timesUtils from "@al/utils/times";

const texts = {
  and: "AND",
  or: "OR",
  contains: "Contains",
  notContains: "Not Contains",
  allFields: "All Fields",
};

interface GridsOptions {
  msgs: GridOptions<GroupedMsg>;
  httpCodes: GridOptions<GroupedMsg>;
  jobs: GridOptions<GroupedMsg>;
  plugins: GridOptions<GroupedMsg>;
  unchanged: GridOptions<GroupedMsg>;
  added: GridOptions<GroupedMsg>;
  removed: GridOptions<GroupedMsg>;
}

function Filters(props: FiltersProps) {
  const gridsRefs: GridsRefs = {
    msgs: {} as AgGridSolidRef,
    httpCodes: {} as AgGridSolidRef,
    jobs: {} as AgGridSolidRef,
    plugins: {} as AgGridSolidRef,
    unchanged: {} as AgGridSolidRef,
    added: {} as AgGridSolidRef,
    removed: {} as AgGridSolidRef,
  };

  const {
    savedFilterName,
    filters,
    msgs,
    httpCodes,
    jobs,
    plugins,
    unchangedLogs,
    addedLogs,
    removedLogs,
    setFilters,
    setSavedFilterName,
    handleFiltersChange,
    handleLogsSelectionChanged,
    handleErrorsOnlyChange,
    handleResetClick,
    handleNewSearchTerm,
    handleSaveFilter,
    handleLoadFilter,
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
    unchanged: { ...commonGridOptions, rowData: unchangedLogs() },
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

  function handleFiltersEnterKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleFiltersChange();
    }
  }

  function handleNLogsKeyDown(e: KeyboardEvent) {
    timesUtils.debounce(handleLogsSelectionChanged, 600)(gridsRefs);
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
        <Select
          class="app-select"
          initialValue={texts.allFields}
          {...createOptions([texts.allFields, ...comparer.last().keys])}
          onChange={(val) =>
            setFilters(
              "terms",
              i(),
              "field",
              val === texts.allFields ? "" : val
            )
          }
        />
        <TextField
          label="Search"
          value={term.value}
          onChange={(_, val) =>
            setFilters("terms", i(), "value", val.toLowerCase())
          }
          onKeyDown={handleFiltersEnterKey}
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
            onKeyDown={handleFiltersEnterKey}
          />
          <TextField
            label="End Time(Exclusive)"
            value={filters.endTime}
            onChange={(_, val) => setFilters("endTime", val)}
            onKeyDown={handleFiltersEnterKey}
          />
          <TextField
            label="Regex Search"
            value={filters.regex}
            onChange={(_, val) => setFilters("regex", val)}
            onKeyDown={handleFiltersEnterKey}
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
          <Divider orientation="vertical" flexItem></Divider>
          <TextField
            label="First N Logs"
            value={filters.firstN}
            onChange={(_, val) =>
              setFilters("firstN", isNaN(+val) || +val < 0 ? 0 : +val)
            }
            onKeyDown={handleNLogsKeyDown}
          />
          <TextField
            label="Last N Logs"
            value={filters.lastN}
            onChange={(_, val) =>
              setFilters("lastN", isNaN(+val) || +val < 0 ? 0 : +val)
            }
            onKeyDown={handleNLogsKeyDown}
          />
          <Alert severity="info">
            N-Logs works only with the below "selection" filters.
          </Alert>
          <TextField
            label="Filter Name"
            value={savedFilterName()}
            onChange={(_, val) => setSavedFilterName(val)}
          />
          <Button variant="contained" onClick={handleSaveFilter}>
            Save Filters
          </Button>
          <FormControlLabel
            control={
              <Select
                class="app-select"
                options={savedFilterKeys()}
                onChange={(val) => handleLoadFilter(val)}
              />
            }
            label="Load Filter"
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
          <Grid item xs={4}>
            <GroupedMsgGrid
              ref={gridsRefs.added}
              name="Added Logs"
              options={gridsOptions.added}
            ></GroupedMsgGrid>
          </Grid>
          <Grid item xs={4}>
            <GroupedMsgGrid
              ref={gridsRefs.removed}
              name="Removed Logs"
              options={gridsOptions.removed}
            ></GroupedMsgGrid>
          </Grid>
          <Grid item xs={4}>
            <GroupedMsgGrid
              ref={gridsRefs.unchanged}
              name="Unchanged Logs"
              options={gridsOptions.unchanged}
            ></GroupedMsgGrid>
          </Grid>
        </Grid>
      </Show>
    </Grid>
  );
}

export default Filters;
