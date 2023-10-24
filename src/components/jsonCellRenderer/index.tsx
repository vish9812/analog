import type { ICellRendererParams } from "ag-grid-community";
import jsonFormatter from "./jsonFormatter";

function JSONCellRenderer(props: ICellRendererParams) {
  return <span innerHTML={jsonFormatter.format(props.value)}></span>;
}

export default JSONCellRenderer;
