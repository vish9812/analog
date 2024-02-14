import { ICellRendererParams } from "ag-grid-community";
import { Button } from "@suid/material";
import JSONCellRenderer from "../jsonCellRenderer";

function FullDataCellRenderer(props: ICellRendererParams) {
  return (
    <>
      {JSONCellRenderer(props)}
      <Button
        onClick={() =>
          props.context.handleContextClick(props.api, props.data.id)
        }
      >
        Context
      </Button>
    </>
  );
}

export default FullDataCellRenderer;
