import AgGridSolid from "ag-grid-solid";
import { Grid, Button, Typography } from "@suid/material";
import useViewModel from "./useViewModel";
import DataDialog from "../components/dataDialog";
import Filters from "../components/filters";
import gridService from "./gridService";

function Analyzer() {
  const {
    handleCellDoubleClick,
    handleFiltersChange,
    rows,
    cols,
    viewData,
    selectedCellData,
    closeDialog,
    downloadSubset,
  } = useViewModel();

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} margin={2}>
        <Filters onFiltersChange={handleFiltersChange}></Filters>
      </Grid>
      <Grid item xs={12} container spacing={2}>
        <Grid item xs={3}>
          <Typography variant="h4" margin={2}>
            All Logs
            {rows().length ? " : " + rows().length.toLocaleString() : ""}
          </Typography>
        </Grid>
        <Grid item xs={9}>
          <Button sx={{ margin: 2 }} variant="text" onClick={downloadSubset}>
            Download the subset
          </Button>
        </Grid>
        <Grid item xs={12}>
          <div style={{ height: "550px" }} class="ag-theme-alpine">
            <AgGridSolid
              defaultColDef={gridService.defaultColDef}
              rowData={rows()}
              columnDefs={cols()}
              onCellDoubleClicked={handleCellDoubleClick}
            />
          </div>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <DataDialog
          data={selectedCellData()}
          open={viewData()}
          onClose={closeDialog}
        ></DataDialog>
      </Grid>
    </Grid>
  );
}

export default Analyzer;
