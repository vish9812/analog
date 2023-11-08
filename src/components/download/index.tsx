import { Button } from "@suid/material";
import useViewModel, { Props } from "./useViewModel";

function Download(props: Props) {
  const { downloadSubset } = useViewModel(props);

  return (
    <Button sx={{ margin: 2 }} variant="outlined" onClick={downloadSubset}>
      Download the subset
    </Button>
  );
}

export default Download;
