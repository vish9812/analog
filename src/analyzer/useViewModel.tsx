import LogsProcessor, { JSONLog, JSONLogs } from "../models/processor";
import { CellDoubleClickedEvent } from "ag-grid-community";
import { createSignal } from "solid-js";
import { FiltersData } from "../components/filters/useViewModel";
import comparer from "../models/comparer";
import stringsUtils from "../utils/strings";
import filesUtils from "../utils/files";
import Processor from "../models/processor";
import gridService from "./gridService";
import timesUtils from "../utils/times";
import { AgGridSolidRef } from "ag-grid-solid";

let zeroJump: string;
let prevJumps: string[] = [];
let nextJumps: string[] = [];

function useViewModel() {
  const [timeJumps, setTimeJumps] = createSignal({
    nextDisabled: true,
    prevDisabled: true,
  });
  const [rows, setRows] = createSignal(comparer.last().logs);
  const [initialCols, setInitialCols] = createSignal(gridService.defaultCols());
  const [cols, setCols] = createSignal(gridService.defaultCols());

  const [viewData, setViewData] = createSignal(false);
  const [selectedCellData, setSelectedCellData] = createSignal("");

  function handleCellDoubleClick(e: CellDoubleClickedEvent<JSONLog, string>) {
    setSelectedCellData(e.value!);
    setViewData(true);
  }

  function closeDialog() {
    setViewData(false);
  }

  function handleColsChange(cols: string[]) {
    const gridCols = cols.map((c) => gridService.getCol(c));
    setCols(gridCols);
  }

  function handleFiltersChange(filtersData: FiltersData) {
    let prevTime: Date;
    prevJumps = [];
    nextJumps = [];

    const filteredLogs: JSONLogs = comparer.last().logs.filter((log) => {
      let keep = true;

      if (keep && filtersData.startTime) {
        keep = log[Processor.logKeys.timestamp] >= filtersData.startTime;
      }
      if (keep && filtersData.endTime) {
        keep = log[Processor.logKeys.timestamp] <= filtersData.endTime;
      }
      if (keep && filtersData.errorsOnly) {
        keep = LogsProcessor.isErrorLog(log);
      }
      if (keep && filtersData.regex) {
        keep = stringsUtils.regexMatch(
          log[Processor.logKeys.fullData],
          filtersData.regex
        );
      }

      if (keep && filtersData.msgs.length) {
        keep = filtersData.msgs.some((msg) =>
          log[Processor.logKeys.msg].startsWith(msg)
        );
      }

      if (keep) {
        const id = log[Processor.logKeys.id];
        const time = new Date(log[Processor.logKeys.timestamp]);
        if (!zeroJump) {
          zeroJump = id;
          prevTime = time;
        }

        if (timesUtils.diffMinutes(prevTime, time) > 13) {
          nextJumps.push(id);
        }

        prevTime = time;
      }

      return keep;
    });

    setRows(() => filteredLogs);

    // Convert this queue to stack to avoid shift/unshift operations
    nextJumps.reverse();
    setTimeJumps(() => ({
      nextDisabled: nextJumps.length === 0,
      prevDisabled: prevJumps.length === 0,
    }));
  }

  function downloadSubset() {
    filesUtils.downloadNewFile(
      "filtered-logs.log",
      rows().map((m) => m[Processor.logKeys.fullData])
    );
  }

  function handleTimeJump(gridRef: AgGridSolidRef, next: boolean) {
    let jumpID: string = "";
    if (next && nextJumps.length) {
      jumpID = nextJumps.pop()!;
      prevJumps.push(jumpID);
    } else if (!next && prevJumps.length) {
      const currID = prevJumps.pop()!;
      jumpID = prevJumps.at(-1) || zeroJump;
      nextJumps.push(currID);
    }

    if (jumpID) {
      gridRef.api.ensureNodeVisible(gridRef.api.getRowNode(jumpID), "top");
      setTimeJumps(() => ({
        nextDisabled: nextJumps.length === 0,
        prevDisabled: prevJumps.length === 0,
      }));
    }
  }

  return {
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
  };
}

export default useViewModel;
