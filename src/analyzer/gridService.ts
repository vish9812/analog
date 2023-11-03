import type { ICellRendererParams, ColDef } from "ag-grid-community";
import JSONCellRenderer from "../components/jsonCellRenderer";
import FullDataCellRenderer from "../components/fullDataCellRenderer";
import Processor from "../models/processor";

const defaultColDef: ColDef = {
  resizable: true,
  wrapText: true,
  autoHeight: true,
} as const;

function defaultCols(): ColDef[] {
  return [
    {
      field: Processor.logKeys.id,
      width: 100,
      sortable: true,
      sort: "asc",
      sortingOrder: ["asc", "desc"],
    },
    {
      field: Processor.logKeys.fullData,
      cellRenderer: FullDataCellRenderer,
      flex: 2,
    },
    {
      field: Processor.logKeys.timestamp,
      width: 270,
    },
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
    cellRenderer: (params: ICellRendererParams) => {
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
