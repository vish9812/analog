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
import LogData from "@al/models/logData";
import usePage from "../usePage";

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

function Normalize() {
  const { setPage } = usePage();

  const {
    logDatas,
    newFileDisabled,
    analyzeDisabled,
    processingFile,
    handleAnalyzeClick,
    handleFileUpload,
  } = useViewModel();

  const newFileText = () =>
    logDatas().length === 1 ? "Compare With" : "New File";

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
            {newFileText()}
            <HiddenInput
              type="file"
              multiple={false}
              onChange={(e) => handleFileUpload(e.target.files!, new LogData())}
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
      <Show when={!!logDatas().length}>
        <Grid item xs={3}>
          <List subheader="Files">
            <For each={logDatas()}>
              {(logData) => {
                return (
                  <ListItem disablePadding>
                    <ListItemButton>
                      <ListItemIcon>
                        <InsertDriveFileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={logData.fileInfo.name}
                        secondary={prettyBytes(logData.fileInfo.size)}
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

export default Normalize;
