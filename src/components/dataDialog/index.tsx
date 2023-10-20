import "@alenaksu/json-viewer";

import {
  Button,
  Dialog,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@suid/material";
import CloseIcon from "@suid/icons-material/Close";
import { Show } from "solid-js";
import { type JsonViewer } from "@alenaksu/json-viewer/dist/JsonViewer";
import useViewModel, { Props } from "./useViewModel";
import objectsUtils from "../../utils/objects";

function DataDialog(props: Props) {
  let jsonViewerRef = {} as JsonViewer;

  const { expanded, handleExpandToggle, data } = useViewModel(props);

  return (
    <Dialog
      fullScreen={objectsUtils.isJSON(data())}
      open={props.open}
      onClose={props.onClose}
      style={{ padding: "10px 50px" }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} justifyContent="right">
            <IconButton edge="start" onClick={props.onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Grid>
        <Show when={objectsUtils.isJSON(data())}>
          <Grid item xs={12}>
            <Typography variant="h6">JSON Data</Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button onClick={() => handleExpandToggle(jsonViewerRef)}>
                {expanded() ? "Collapse" : "Expand"} All
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <json-viewer ref={jsonViewerRef}>{data()}</json-viewer>
          </Grid>
        </Show>
        <Grid item xs={12}>
          <Typography variant="h6">Plain Text Data</Typography>
          <Typography variant="body1">{data()}</Typography>
        </Grid>
      </Grid>
    </Dialog>
  );
}

export default DataDialog;
