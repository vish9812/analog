import { Button } from "@suid/material";
import useViewModel, { Props } from "./useViewModel";

function TimeJumps(props: Props) {
  const { handleJump, nextEmpty, prevEmpty } = useViewModel(props);

  return (
    <>
      <Button
        variant="outlined"
        disabled={prevEmpty()}
        onClick={() => handleJump(false)}
      >
        {"<<"}
      </Button>
      Time Jumps
      <Button
        variant="outlined"
        disabled={nextEmpty()}
        onClick={() => handleJump(true)}
      >
        {">>"}
      </Button>
    </>
  );
}

export default TimeJumps;
