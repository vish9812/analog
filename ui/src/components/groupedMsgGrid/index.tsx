import { GroupedMsg } from "@al/models/logData";
import { GridOptions } from "ag-grid-community";
import AgGridSolid, { AgGridSolidRef } from "ag-grid-solid";

interface Props {
  name: string;
  ref: AgGridSolidRef;
  options: GridOptions<GroupedMsg>;
}

function GroupedMsgGrid(props: Props) {
  const count = () => (props.options.rowData || []).length;

  return (
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="card-title text-lg font-semibold">
            {props.name}
            {count() > 0 && (
              <span class="badge badge-primary ml-2">
                {count().toLocaleString()}
              </span>
            )}
          </h3>
        </div>

        <div class="rounded-lg border border-base-300 overflow-hidden">
          <div style={{ height: "350px" }} class="ag-theme-alpine">
            <AgGridSolid ref={props.ref} {...props.options} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupedMsgGrid;
