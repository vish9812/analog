import { ICellRendererParams } from "ag-grid-community";
import JSONCellRenderer from "../jsonCellRenderer";

function FullDataCellRenderer(props: ICellRendererParams) {
  return (
    <div class="flex items-center gap-2">
      <div class="flex-1">{JSONCellRenderer(props)}</div>
      <button
        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100"
        onClick={() =>
          props.context.handleContextClick(props.api, props.data.id)
        }
      >
        Context
      </button>
    </div>
  );
}

export default FullDataCellRenderer;
