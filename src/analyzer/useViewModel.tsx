import LogsProcessor, { JSONLog } from "../models/processor";
import { CellDoubleClickedEvent } from "ag-grid-community";
import { createSignal } from "solid-js";
import { FiltersData } from "../components/filters/useViewModel";
import comparer from "../models/comparer";
import stringsUtils from "../utils/strings";
import filesUtils from "../utils/files";
import Processor from "../models/processor";
import gridService from "./gridService";

function useViewModel() {
  const [rows, setRows] = createSignal(
    gridService.getRows(comparer.last().logs)
  );
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

  function handleColsChange(cols: string[] | string) {
    console.log(cols);
    const gridCols = (typeof cols === "string" ? cols.split(",") : cols).map(
      (c) => gridService.getCol(c)
    );
    setCols(gridCols);
  }

  function handleFiltersChange(filtersData: FiltersData) {
    setRows(() =>
      gridService.getRows(
        comparer.last().logs.filter((log) => {
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

          return keep;
        })
      )
    );
  }

  function downloadSubset() {
    filesUtils.downloadNewFile(
      "filtered-logs.log",
      rows().map((m) => m[Processor.logKeys.fullData])
    );
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
  };
}

export default useViewModel;
