import { GroupedMsg } from "@al/models/logData";
import { GridOptions } from "ag-grid-community";
import AgGridSolid, { AgGridSolidRef } from "solid-ag-grid";

interface Props {
  name: string;
  ref: AgGridSolidRef;
  options: GridOptions<GroupedMsg>;
}

function GroupedMsgGrid(props: Props) {
  const count = () => (props.options.rowData || []).length;

  return (
    <div class="bg-white rounded-lg shadow-lg">
      <div class="p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-semibold">
            {props.name}
            {count() > 0 && (
              <span class="ml-2 px-2 py-0.5 text-sm text-white bg-blue-500 rounded-full">
                {count().toLocaleString()}
              </span>
            )}
          </h3>
        </div>

        <div class="rounded-lg border border-gray-200 overflow-hidden">
          <div style={{ height: "350px" }} class="ag-theme-alpine">
            <AgGridSolid ref={props.ref} {...props.options} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupedMsgGrid;
