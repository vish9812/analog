import { createSignal } from "solid-js";
import gridService from "./gridService";
import { AgGridSolidRef } from "ag-grid-solid";
import { GridApi } from "ag-grid-community";
import { FiltersData, SearchTerm } from "@al/components/filters/useViewModel";
import LogData, { JSONLogs } from "@al/models/logData";
import stringsUtils from "@al/utils/strings";
import comparer from "@al/services/comparer";
import useJumper from "@al/components/timeJumps/useJumper";

function useViewModel() {
  const [rows, setRows] = createSignal(comparer.last().logs);
  const [initialCols, setInitialCols] = createSignal(gridService.defaultCols());
  const [cols, setCols] = createSignal(gridService.defaultCols());
  const {
    reset: resetJumps,
    validator: jumpValidator,
    adder: jumpAdder,
  } = useJumper;

  function handleColsChange(cols: string[]) {
    const gridCols = cols.map((c) => gridService.getCol(c));
    setCols(gridCols);
  }

  function handleFiltersChange(filtersData: FiltersData) {
    resetJumps();
    const validJump = jumpValidator();
    const { add: addJump, done: doneAddingJumps } = jumpAdder();

    let filteredLogs: JSONLogs = filtersData.logs.length
      ? filtersData.logs
      : comparer.last().logs;

    filteredLogs = filteredLogs.filter((log) => {
      let keep = true;

      if (keep && filtersData.startTime) {
        keep = log[LogData.logKeys.timestamp] >= filtersData.startTime;
      }
      if (keep && filtersData.endTime) {
        keep = log[LogData.logKeys.timestamp] < filtersData.endTime;
      }
      if (keep && filtersData.errorsOnly) {
        keep = LogData.isErrorLog(log);
      }

      const fullData = log[LogData.logKeys.fullData].toLowerCase();
      if (keep && filtersData.regex) {
        keep = stringsUtils.regexMatch(fullData, filtersData.regex);
      }
      if (keep && filtersData.terms) {
        const updateCurrCondition = (term: SearchTerm) => {
          const field = term.field;
          const val = term.value.trim();
          if (field && !val) {
            currCondition = term.contains
              ? log[field] !== undefined
              : log[field] === undefined;

            return;
          }

          if (val) {
            if (field) {
              const fieldVal =
                (log[field] && log[field].toString().toLowerCase()) || "";
              currCondition = term.contains
                ? fieldVal.includes(val)
                : !fieldVal.includes(val);
            } else {
              currCondition = term.contains
                ? fullData.includes(val)
                : !fullData.includes(val);
            }
          }
        };

        let currCondition = false;
        const ors = filtersData.terms.filter((t) => !t.and);
        for (const term of ors) {
          if (currCondition) break;
          updateCurrCondition(term);
        }

        currCondition = ors.length > 0 ? currCondition : true;
        const ands = filtersData.terms.filter((t) => t.and);
        for (const term of ands) {
          if (!currCondition) break;
          updateCurrCondition(term);
        }

        keep = currCondition;
      }

      if (keep) {
        if (validJump(new Date(log[LogData.logKeys.timestamp]))) {
          addJump(log[LogData.logKeys.id]);
        }
      }

      return keep;
    });

    doneAddingJumps();
    setRows(() => filteredLogs);
  }

  function handleTimeJump(gridRef: AgGridSolidRef, jumpID: string) {
    gridRef.api.ensureNodeVisible(gridRef.api.getRowNode(jumpID), "middle");
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
    initialCols,
    setInitialCols,
    handleTimeJump,
    handleContextClick,
  };
}

export default useViewModel;
