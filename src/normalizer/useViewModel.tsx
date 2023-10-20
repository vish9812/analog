import { Setter, createSignal } from "solid-js";
import { Pages, type PagesValues } from "../hooks/usePage";
import type Processor from "../models/processor";
import comparer from "../models/comparer";

function useViewModel() {
  const [analyzeDisabled, setAnalyzeDisabled] = createSignal(true);
  const [processingFile, setProcessingFile] = createSignal(false);
  const [processors, setProcessors] = createSignal<Processor[]>([]);
  const newFileDisabled = () => processors().length > 1;

  const handleAnalyzeClick = (setPage: Setter<PagesValues>) => {
    setPage(Pages.analyzer);
  };

  const handleFileUpload = async (files: FileList, processor: Processor) => {
    setProcessingFile(true);
    setAnalyzeDisabled(true);

    await processor.init(files[0]);
    comparer.addProcessor(processor);
    setProcessors((prev) => [...prev, processor]);

    setAnalyzeDisabled(false);
    setProcessingFile(false);
  };

  return {
    processors,
    newFileDisabled,
    analyzeDisabled,
    processingFile,
    handleAnalyzeClick,
    handleFileUpload,
  };
}

export default useViewModel;
