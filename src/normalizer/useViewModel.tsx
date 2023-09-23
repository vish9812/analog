import { createSignal } from "solid-js";
import usePage, { Pages } from "../hooks/usePage";
import LogsProcessor from "../models/logsProcessor";

function useViewModel() {
  const { setPage } = usePage();
  const [analyzeDisabled, setAnalyzeDisabled] = createSignal(true);
  const [processingFile, setProcessingFile] = createSignal(false);

  const handleAnalyzeClick = () => {
    setPage(Pages.analyzer);
  };

  const handleFileUpload = async (files: FileList) => {
    setProcessingFile(true);
    setAnalyzeDisabled(true);
    const file = files[0];
    const lines = LogsProcessor.getLines(await file.text());
    LogsProcessor.instance = new LogsProcessor(lines);
    setAnalyzeDisabled(false);
    setProcessingFile(false);
  };

  return {
    analyzeDisabled,
    processingFile,
    handleAnalyzeClick,
    handleFileUpload,
  };
}

export default useViewModel;
