import AgGridSolid from "ag-grid-solid";
import { Grid, Stack, Button, Divider, Typography } from "@suid/material";
import useViewModel from "./useViewModel";
import DataDialog from "../components/dataDialog";
import Filters from "../components/filters";
import gridService from "./gridService";

function Analyzer() {
  const {
    handleNormalizeClick,
    handleCellDoubleClick,
    handleFiltersChange,
    rows,
    cols,
    viewData,
    selectedCellData,
    closeDialog,
  } = useViewModel();

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            sx={{ margin: 2 }}
            variant="contained"
            onClick={handleNormalizeClick}
          >
            New File
          </Button>
        </Stack>
        <Divider></Divider>
      </Grid>
      <Grid item xs={12}>
        <Filters onFiltersChange={handleFiltersChange}></Filters>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h4" margin={2}>
          All Logs
          {rows().length ? " : " + rows().length.toLocaleString() : ""}
        </Typography>
        <div style={{ height: "550px" }} class="ag-theme-alpine">
          <AgGridSolid
            defaultColDef={gridService.defaultColDef}
            rowData={rows()}
            columnDefs={cols()}
            onCellDoubleClicked={handleCellDoubleClick}
          />
        </div>
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
