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
  TextField,
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
    setTimeRange,
  } = useViewModel();

  const newFileText = () =>
    logDatas().length === 1 ? "Compare With" : "New File";

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <p>Following are the 3 must have keys in the logs:</p>
        <pre>{`
- level
- timestamp
- msg
      `}</pre>
        <p>Expected Format for JSON logs:</p>
        <pre>{`
{"timestamp":"2023-10-16 10:13:16.710 +11:00","level":"debug","msg":"Received HTTP request","dynamicKey1":"value 1","dynamicKey2":"value 2"}
        `}</pre>

        <p>Expected Format for plain-text logs:</p>
        <pre>{`
debug [2023-10-16 10:13:16.710 +11:00] Received HTTP request dynamicKey1="value 1" dynamicKey2=value 2
        `}</pre>
      </Grid>
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
              onChange={(e) => {
                handleFileUpload(e.target.files, new LogData());
                // To allow uploading the same file again and triggering the "onChange" event for the same file
                e.target.value = "";
              }}
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
        <Grid item xs={12} textAlign="center">
          You can <em>optionally</em> filter the files by time
          <br />- In case of big files( &gt; 100MB) for faster processing of
          data
          <br />- To compare different time slices of the same or different
          files
        </Grid>
        <Grid item xs={12}>
          <List subheader="Files">
            <For each={logDatas()}>
              {(logData, idx) => {
                return (
                  <ListItem disablePadding>
                    <Grid container spacing={2}>
                      <Grid item xs={3}>
                        <ListItemButton>
                          <ListItemIcon>
                            <InsertDriveFileIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={logData.fileInfo.name}
                            secondary={prettyBytes(logData.fileInfo.size)}
                          />
                        </ListItemButton>
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          fullWidth={true}
                          label="Start Time(Inclusive)"
                          onChange={(_, val) => setTimeRange(idx(), "min", val)}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          fullWidth={true}
                          label="End Time(Exclusive)"
                          onChange={(_, val) => setTimeRange(idx(), "max", val)}
                        />
                      </Grid>
                    </Grid>
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
