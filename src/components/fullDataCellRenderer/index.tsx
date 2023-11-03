import type { ICellRendererParams } from "ag-grid-community";
import JSONCellRenderer from "../jsonCellRenderer";
import { Button } from "@suid/material";

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
