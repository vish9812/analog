import type { JsonViewer } from "@alenaksu/json-viewer/dist/JsonViewer";
import { createSignal } from "solid-js";

interface Props {
  open: boolean;
  data: any;
  onClose: () => void;
}

function useViewModel(props: Props) {
  const [expanded, setExpanded] = createSignal(false);

  function handleExpandToggle(jsonViewerRef: JsonViewer) {
    if (expanded()) {
      jsonViewerRef.collapseAll();
    } else {
      jsonViewerRef.expandAll();
    }

    setExpanded((prev) => !prev);
  }

  function data() {
    return typeof props.data === "object"
      ? JSON.stringify(props.data)
      : props.data;
  }

  return {
    expanded,
    handleExpandToggle,
    data,
  };
}

export default useViewModel;
export type { Props };
