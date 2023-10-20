import { type ColDef } from "ag-grid-community";

const defaultColDef: ColDef = {
  resizable: true,
  wrapText: true,
  autoHeight: true,
} as const;

function defaultCols(): ColDef[] {
  return [
    { field: "msg", minWidth: 500 },
    { field: "fullData", flex: 1, filter: "agTextColumnFilter" },
    { field: "timestamp", width: 270, sortable: true },
    { field: "level", width: 100 },
  ];
}

function getCol(field: string): ColDef {
  const col = defaultCols().find((c) => c.field === field);
  if (col) {
    return col;
  }

  return {
    field: field,
    flex: 1,
    cellRenderer: (params: any) => {
      const val =
        typeof params.value === "object"
          ? JSON.stringify(params.value)
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
