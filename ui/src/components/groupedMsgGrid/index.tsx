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
    <>
      <h3>
        {props.name}
        {count() ? " : " + count().toLocaleString() : ""}
      </h3>
      <div style={{ height: "350px" }} class="ag-theme-alpine">
        <AgGridSolid ref={props.ref} {...props.options} />
      </div>
    </>
  );
}

export default GroupedMsgGrid;
