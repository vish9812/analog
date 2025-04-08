import FullDataCellRenderer from "@al/components/fullDataCellRenderer";
import JSONCellRenderer from "@al/components/jsonCellRenderer";
import LogData from "@al/models/logData";
import { ICellRendererParams, ColDef } from "ag-grid-community";

const defaultColDef: ColDef = {
  resizable: true,
  wrapText: true,
  autoHeight: true,
} as const;

function defaultCols(): ColDef[] {
  return [
    {
      field: LogData.logKeys.id,
      width: 100,
      sortable: true,
      sort: "asc",
      sortingOrder: ["asc", "desc"],
    },
    {
      field: LogData.logKeys.msg,
      flex: 0.75,
    },
    {
      field: LogData.logKeys.fullData,
      cellRenderer: FullDataCellRenderer,
      flex: 2,
    },
    // {
    //   field: LogData.logKeys.timestamp,
    //   width: 270,
    // },
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
