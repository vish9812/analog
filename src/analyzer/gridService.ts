import { ColDef } from "ag-grid-community";
import { JSONLog, JSONLogs } from "../models/processor";

class GridService {
  readonly defaultColDef: ColDef = {
    resizable: true,
  } as const;

  defaultCols(): ColDef[] {
    return [
      { field: "timestamp", width: 270, sortable: true },
      { field: "level", width: 100 },
      { field: "msg", flex: 1 },
      { field: "fullData", flex: 1, filter: "agTextColumnFilter" },
    ];
  }

  getCol(col: string): ColDef {
    const field = this.defaultCols().find((c) => c.field === col);
    if (field) {
      return field;
    }

    return {
      field: col,
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

  getRows(jsons: JSONLogs): JSONLogs {
    return jsons;
  }
}

const gridService = new GridService();
export default gridService;
