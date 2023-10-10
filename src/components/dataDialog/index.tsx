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
import { Show, createSignal } from "solid-js";
import { type JsonViewer } from "@alenaksu/json-viewer/dist/JsonViewer";

interface Props {
  open: boolean;
  data: string;
  onClose: () => void;
}

function DataDialog(props: Props) {
  let jsonViewer = {} as JsonViewer;

  const data = () =>
    typeof props.data === "object" ? JSON.stringify(props.data) : props.data;

  let isJSON = () => {
    try {
      JSON.parse(data());
      return true;
    } catch (err) {
      return false;
    }
  };

  const [expanded, setExpanded] = createSignal(false);

  function handleExpandToggle() {
    if (expanded()) {
      jsonViewer.collapseAll();
    } else {
      jsonViewer.expandAll();
    }

    setExpanded((prev) => !prev);
  }

  return (
    <Dialog
      fullScreen={isJSON()}
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
        <Show when={isJSON()}>
          <Grid item xs={12}>
            <Typography variant="h6">JSON Data</Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button onClick={handleExpandToggle}>
                {expanded() ? "Collapse" : "Expand"} All
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <json-viewer ref={jsonViewer}>{data()}</json-viewer>
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
