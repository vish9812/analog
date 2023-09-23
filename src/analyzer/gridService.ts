import { ColDef } from "ag-grid-community";
import { JSONLog, JSONLogs } from "../models/logsProcessor";

class GridService {
  readonly defaultColDef: ColDef = {
    resizable: true,
  } as const;

  getCols(): ColDef<JSONLog, string>[] {
    return [
      { field: "timestamp", minWidth: 270, sortable: true },
      { field: "level", minWidth: 50 },
      { field: "msg", flex: 2 },
      { field: "fullData", flex: 1, filter: "agTextColumnFilter" },
    ];
  }

  getRows(jsons: JSONLogs): JSONLogs {
    return jsons;
  }
}

const gridService = new GridService();
export default gridService;
