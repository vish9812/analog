import comparer from "@al/services/comparer";
import LogData, { type JSONLog } from "@al/models/logData";
import { Setter, createSignal } from "solid-js";
import { PagesValues, Pages } from "../usePage";
import normalizer from "@al/services/normalizer";
import { createStore } from "solid-js/store";

// Temporarily store files
// Empty the array once processed to free the memory
let logFiles: File[] = [];

interface TimeRange {
  min: string;
  max: string;
}

function useViewModel() {
  const [analyzeDisabled, setAnalyzeDisabled] = createSignal(true);
  const [processingFile, setProcessingFile] = createSignal(false);
  const [timeRange, setTimeRange] = createStore<TimeRange[]>([]);
  const [logDatas, setLogDatas] = createSignal<LogData[]>([]);
  const newFileDisabled = () => logDatas().length > 1;

  async function handleAnalyzeClick(setPage: Setter<PagesValues>) {
    setProcessingFile(true);
    setAnalyzeDisabled(true);

    for (let i = 0; i < logFiles.length; i++) {
      const logData = logDatas()[i];
      await normalizer.init(logData, logFiles[i], getFilterFn(timeRange[i]));
      comparer.addLogData(logData);
    }

    setAnalyzeDisabled(false);
    setProcessingFile(false);

    logFiles = [];

    setPage(Pages.analyze);
  }

  function handleFileUpload(files: FileList | null, logData: LogData) {
    if (!files || !files.length) return;

    const file = files[0];
    logData.initFileInfo(file);

    logFiles.push(file);
    setLogDatas((prev) => [...prev, logData]);
    setTimeRange(timeRange.length, { min: "", max: "" });
    setAnalyzeDisabled(false);
  }

  function getFilterFn(timeRange: TimeRange) {
    return ({ timestamp }: JSONLog) =>
      !!(
        (timeRange.min && timestamp < timeRange.min) ||
        (timeRange.max && timestamp > timeRange.max)
      );
  }

  return {
    logDatas,
    newFileDisabled,
    analyzeDisabled,
    processingFile,
    handleAnalyzeClick,
    handleFileUpload,
    setTimeRange,
  };
}

export default useViewModel;
