import { createSignal } from "solid-js";
import usePage, { Pages } from "../hooks/usePage";
import Processor from "../models/processor";
import comparer from "../models/comparer";

function useViewModel() {
  const { setPage } = usePage();
  const [analyzeDisabled, setAnalyzeDisabled] = createSignal(true);
  const [processingFile, setProcessingFile] = createSignal(false);
  const [processors, setProcessors] = createSignal<Processor[]>([]);
  const newFileDisabled = () => processors().length > 1;

  const handleAnalyzeClick = () => {
    setPage(Pages.analyzer);
  };

  const handleFileUpload = async (files: FileList) => {
    setProcessingFile(true);
    setAnalyzeDisabled(true);

    const processor = await new Processor().init(files[0]);
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
