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

  let isJSON = () => {
    try {
      JSON.parse(props.data);
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
    <Dialog fullScreen={isJSON()} open={props.open} onClose={props.onClose}>
      <Show
        when={isJSON()}
        fallback={
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="right">
                <IconButton edge="start" onClick={props.onClose}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">{props.data}</Typography>
            </Grid>
          </Grid>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="right">
              <IconButton edge="start" onClick={props.onClose}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button onClick={handleExpandToggle}>
                {expanded() ? "Collapse" : "Expand"} All
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <json-viewer ref={jsonViewer}>{props.data}</json-viewer>
          </Grid>
        </Grid>
      </Show>
    </Dialog>
  );
}

export default DataDialog;
