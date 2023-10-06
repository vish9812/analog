import LogsProcessor, { JSONLog } from "../models/processor";
import GridService from "./gridService";
import { CellDoubleClickedEvent } from "ag-grid-community";
import { createSignal } from "solid-js";
import { FiltersData } from "../components/filters/useViewModel";
import comparer from "../models/comparer";
import stringsUtils from "../utils/strings";
import filesUtils from "../utils/files";
import Processor from "../models/processor";

function useViewModel() {
  const [rows, setRows] = createSignal(
    GridService.getRows(comparer.last().logs)
  );
  const [cols, setCols] = createSignal(GridService.getCols());

  const [viewData, setViewData] = createSignal(false);
  const [selectedCellData, setSelectedCellData] = createSignal("");

  function handleCellDoubleClick(e: CellDoubleClickedEvent<JSONLog, string>) {
    setSelectedCellData(e.value!);
    setViewData(true);
  }

  function closeDialog() {
    setViewData(false);
  }

  function handleFiltersChange(filtersData: FiltersData) {
    setRows(() =>
      GridService.getRows(
        comparer.last().logs.filter((r) => {
          let keep = true;

          if (keep && filtersData.startTime) {
            keep = r[Processor.logKeys.timestamp] >= filtersData.startTime;
          }
          if (keep && filtersData.endTime) {
            keep = r[Processor.logKeys.timestamp] <= filtersData.endTime;
          }
          if (keep && filtersData.errorsOnly) {
            keep = LogsProcessor.isErrorLog(r);
          }
          if (keep && filtersData.regex) {
            keep = stringsUtils.regexMatch(
              r[Processor.logKeys.fullData],
              filtersData.regex
            );
          }
          if (keep && filtersData.msgs.length) {
            keep = filtersData.msgs.some((msg) =>
              r[Processor.logKeys.msg].startsWith(msg)
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
    rows,
    cols,
    viewData,
    selectedCellData,
    closeDialog,
    downloadSubset,
  };
}

export default useViewModel;
