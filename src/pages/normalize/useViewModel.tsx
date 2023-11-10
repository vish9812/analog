import comparer from "@al/services/comparer";
import LogData from "@al/models/logData";
import { Setter, createSignal } from "solid-js";
import { PagesValues, Pages } from "../usePage";
import normalizer from "@al/services/normalizer";

function useViewModel() {
  const [analyzeDisabled, setAnalyzeDisabled] = createSignal(true);
  const [processingFile, setProcessingFile] = createSignal(false);
  const [logDatas, setLogDatas] = createSignal<LogData[]>([]);
  const newFileDisabled = () => logDatas().length > 1;

  const handleAnalyzeClick = (setPage: Setter<PagesValues>) => {
    setPage(Pages.analyze);
  };

  const handleFileUpload = async (files: FileList, logData: LogData) => {
    if (!files || !files.length) return;

    setProcessingFile(true);
    setAnalyzeDisabled(true);

    await normalizer.init(logData, files[0]);
    comparer.addLogData(logData);
    setLogDatas((prev) => [...prev, logData]);

    setAnalyzeDisabled(false);
    setProcessingFile(false);
  };

  return {
    logDatas,
    newFileDisabled,
    analyzeDisabled,
    processingFile,
    handleAnalyzeClick,
    handleFileUpload,
  };
}

export default useViewModel;
