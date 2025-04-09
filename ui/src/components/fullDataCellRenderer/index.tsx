import { ICellRendererParams } from "ag-grid-community";
import JSONCellRenderer from "../jsonCellRenderer";

function FullDataCellRenderer(props: ICellRendererParams) {
  return (
    <div class="flex items-center gap-2">
      <div class="flex-1">{JSONCellRenderer(props)}</div>
      <button
        class="btn btn-xs btn-outline gap-1"
        onClick={() =>
          props.context.handleContextClick(props.api, props.data.id)
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Context
      </button>
    </div>
  );
}

export default FullDataCellRenderer;
