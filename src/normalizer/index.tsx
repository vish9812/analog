import {
  Button,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  styled,
} from "@suid/material";
import useViewModel from "./useViewModel";
import FileUploadIcon from "@suid/icons-material/FileUpload";
import MemoryIcon from "@suid/icons-material/Memory";
import InsertDriveFileIcon from "@suid/icons-material/InsertDriveFile";
import { For, Show } from "solid-js";
import prettyBytes from "pretty-bytes";
import Processor from "../models/processor";
import usePage from "../hooks/usePage";

const HiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

function Normalizer() {
  const { setPage } = usePage();

  const {
    processors,
    newFileDisabled,
    analyzeDisabled,
    processingFile,
    handleAnalyzeClick,
    handleFileUpload,
  } = useViewModel();

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <Button
            disabled={newFileDisabled()}
            sx={{ margin: 2 }}
            component="label"
            variant="contained"
            startIcon={<FileUploadIcon />}
          >
            open file
            <HiddenInput
              type="file"
              multiple={false}
              onChange={(e) =>
                handleFileUpload(e.target.files!, new Processor())
              }
            />
          </Button>
          <Show when={processingFile()}>
            <CircularProgress color="success" />
          </Show>
          <Button
            sx={{ margin: 2 }}
            component="label"
            startIcon={<MemoryIcon />}
            variant="contained"
            onClick={() => handleAnalyzeClick(setPage)}
            color="success"
            disabled={analyzeDisabled()}
          >
            Analyze
          </Button>
        </Stack>
      </Grid>
      <Show when={!!processors().length}>
        <Grid item xs={3}>
          <List subheader="Files">
            <For each={processors()}>
              {(processor) => {
                return (
                  <ListItem disablePadding>
                    <ListItemButton>
                      <ListItemIcon>
                        <InsertDriveFileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={processor.fileInfo.name}
                        secondary={prettyBytes(processor.fileInfo.size)}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              }}
            </For>
          </List>
        </Grid>
      </Show>
    </Grid>
  );
}

export default Normalizer;
