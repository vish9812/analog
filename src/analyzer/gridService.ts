import type { ICellRendererParams, ColDef } from "ag-grid-community";
import JSONCellRenderer from "../components/jsonCellRenderer";
import Processor from "../models/processor";

const defaultColDef: ColDef = {
  resizable: true,
  wrapText: true,
  autoHeight: true,
} as const;

function defaultCols(): ColDef[] {
  return [
    {
      field: Processor.logKeys.fullData,
      cellRenderer: JSONCellRenderer,
      flex: 2,
    },
    { field: "timestamp", width: 270, sortable: true },
  ];
}

function getCol(field: string): ColDef {
  const col = defaultCols().find((c) => c.field === field);
  if (col) {
    return col;
  }

  return {
    field: field,
    flex: 0.75,
    cellRenderer: (params: ICellRendererParams<any, any, any>) => {
      const val =
        typeof params.value === "object"
          ? JSONCellRenderer(params)
          : params.value;
      return val;
    },
  };
}

const gridService = {
  defaultColDef,
  defaultCols,
  getCol,
};
export default gridService;
