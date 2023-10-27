import Processor, { JSONLogs } from "../models/processor";
import { createSignal } from "solid-js";
import { FiltersData } from "../components/filters/useViewModel";
import comparer from "../models/comparer";
import stringsUtils from "../utils/strings";
import filesUtils from "../utils/files";
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

  function handleColsChange(cols: string[]) {
    const gridCols = cols.map((c) => gridService.getCol(c));
    setCols(gridCols);
  }

  function handleFiltersChange(filtersData: FiltersData) {
    let prevTime: Date;
    zeroJump = "";
    prevJumps = [];
    nextJumps = [];

    let filteredLogs: JSONLogs = filtersData.logs.length
      ? filtersData.logs
      : comparer.last().logs;

    filteredLogs = filteredLogs.filter((log) => {
      let keep = true;

      if (keep && filtersData.startTime) {
        keep = log[Processor.logKeys.timestamp] >= filtersData.startTime;
      }
      if (keep && filtersData.endTime) {
        keep = log[Processor.logKeys.timestamp] <= filtersData.endTime;
      }
      if (keep && filtersData.errorsOnly) {
        keep = Processor.isErrorLog(log);
      }
      if (keep && filtersData.regex) {
        keep = stringsUtils.regexMatch(
          log[Processor.logKeys.fullData],
          filtersData.regex
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

    // "Reverse" converts the queue(nextJumps) to stack to avoid unshift/shift O(n) ops and instead use push/pop O(1) ops.
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
    if (next) {
      jumpID = nextJumps.pop()!;
      prevJumps.push(jumpID);
    } else {
      const currID = prevJumps.pop()!;
      jumpID = prevJumps.at(-1) || zeroJump;
      nextJumps.push(currID);
    }

    gridRef.api.ensureNodeVisible(gridRef.api.getRowNode(jumpID), "middle");
    setTimeJumps(() => ({
      nextDisabled: nextJumps.length === 0,
      prevDisabled: prevJumps.length === 0,
    }));
  }

  return {
    handleFiltersChange,
    handleColsChange,
    rows,
    cols,
    downloadSubset,
    initialCols,
    setInitialCols,
    timeJumps,
    handleTimeJump,
  };
}

export default useViewModel;
