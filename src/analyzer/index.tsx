import AgGridSolid from "ag-grid-solid";
import {
  Grid,
  Stack,
  Button,
  Divider,
  Typography,
  TextField,
} from "@suid/material";
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
    downloadSubset,
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
      <Grid item xs={12} container spacing={2}>
        <Grid item xs={2}>
          <Typography variant="h4" margin={2}>
            All Logs
            {rows().length ? " : " + rows().length.toLocaleString() : ""}
          </Typography>
        </Grid>
        <Grid item xs={10}>
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
