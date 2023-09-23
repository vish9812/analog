import usePage, { Pages } from "../hooks/usePage";
import LogsProcessor, { JSONLog } from "../models/logsProcessor";
import GridService from "./gridService";
import { CellDoubleClickedEvent } from "ag-grid-community";
import { createSignal } from "solid-js";
import { FiltersData } from "../components/filters/useViewModel";

function useViewModel() {
  const { setPage } = usePage();

  const [rows, setRows] = createSignal(
    GridService.getRows(LogsProcessor.instance.jsons)
  );

  const [cols, setCols] = createSignal(GridService.getCols());

  const [viewData, setViewData] = createSignal(false);
  const [selectedCellData, setSelectedCellData] = createSignal("");

  function handleNormalizeClick() {
    setPage(Pages.normalizer);
  }

  function handleCellDoubleClick(e: CellDoubleClickedEvent<JSONLog, string>) {
    setSelectedCellData(e.value!);
    setViewData(true);
  }

  function closeDialog() {
    setViewData(false);
  }

  function handleFiltersChange(filtersData: FiltersData) {
    setRows(() =>
      GridService.getRows(LogsProcessor.instance.jsons).filter((r) => {
        let keep = true;

        if (keep && filtersData.startTime) {
          keep = r["timestamp"] >= filtersData.startTime;
        }
        if (keep && filtersData.endTime) {
          keep = r["timestamp"] <= filtersData.endTime;
        }
        if (keep && filtersData.errorsOnly) {
          keep = LogsProcessor.isErrorLog(r);
        }
        if (keep && filtersData.regex) {
          keep = LogsProcessor.regexMatch(r["fullData"], filtersData.regex);
        }
        if (keep && filtersData.msgs.length) {
          keep = filtersData.msgs.some((msg) => r["msg"].startsWith(msg));
        }

        return keep;
      })
    );
  }

  return {
    handleNormalizeClick,
    handleCellDoubleClick,
    handleFiltersChange,
    rows,
    cols,
    viewData,
    selectedCellData,
    closeDialog,
  };
}

export default useViewModel;
