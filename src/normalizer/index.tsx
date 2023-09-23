import { Button, CircularProgress, Grid, Stack, styled } from "@suid/material";
import useViewModel from "./useViewModel";
import FileUploadIcon from "@suid/icons-material/FileUpload";
import MemoryIcon from "@suid/icons-material/Memory";
import { Show } from "solid-js";

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
  const {
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
            sx={{ margin: 2 }}
            component="label"
            variant="contained"
            startIcon={<FileUploadIcon />}
          >
            open file
            <HiddenInput
              type="file"
              onChange={(e) => handleFileUpload(e.target.files!)}
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
            onClick={handleAnalyzeClick}
            color="success"
            disabled={analyzeDisabled()}
          >
            Analyze
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
}

export default Normalizer;
