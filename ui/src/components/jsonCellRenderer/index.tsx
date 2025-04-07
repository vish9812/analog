import { ICellRendererParams } from "ag-grid-community";
import jsonFormatter from "./jsonFormatter";

function JSONCellRenderer(props: ICellRendererParams) {
  return (
    <span
      class="font-mono text-sm whitespace-pre-wrap break-all"
      innerHTML={jsonFormatter.format(props.value)}
    ></span>
  );
}

export default JSONCellRenderer;
