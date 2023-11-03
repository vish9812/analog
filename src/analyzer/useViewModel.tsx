import Processor, { JSONLogs } from "../models/processor";
import { createSignal } from "solid-js";
import type {
  FiltersData,
  SearchTerm,
} from "../components/filters/useViewModel";
import comparer from "../models/comparer";
import stringsUtils from "../utils/strings";
import filesUtils from "../utils/files";
import gridService from "./gridService";
import timesUtils from "../utils/times";
import { AgGridSolidRef } from "ag-grid-solid";
import type { GridApi } from "ag-grid-community";

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

      const fullData = log[Processor.logKeys.fullData].toLowerCase();
      if (keep && filtersData.regex) {
        keep = stringsUtils.regexMatch(fullData, filtersData.regex);
      }
      if (keep && filtersData.terms) {
        const ands = filtersData.terms.filter((t) => t.and);
        let currCondition = true;
        const updateCurrCondition = (term: SearchTerm) => {
          const val = term.value.trim();
          if (val) {
            currCondition = term.contains
              ? fullData.includes(val)
              : !fullData.includes(val);
          }
        };

        for (const term of ands) {
          if (!currCondition) break;
          updateCurrCondition(term);
        }

        if (!currCondition) {
          const ors = filtersData.terms.filter((t) => !t.and);

          for (const term of ors) {
            if (currCondition) break;
            updateCurrCondition(term);
          }
        }

        keep = currCondition;
      }

      // Update time jumps
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

  function handleContextClick(gridApi: GridApi, logID: number) {
    const contextLogs: JSONLogs = [];
    const limit = 5;
    const currIdx = logID;
    const firstIdx = Math.max(currIdx - limit, 0);
    const lastIdx = Math.min(currIdx + limit, comparer.last().logs.length - 1);

    for (let i = firstIdx; i <= lastIdx; i++) {
      if (!gridApi.getRowNode(i.toString())) {
        contextLogs.push(comparer.last().logs[i]);
      }
    }

    setRows((pre) => [...pre, ...contextLogs]);
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
    handleContextClick,
  };
}

export default useViewModel;
