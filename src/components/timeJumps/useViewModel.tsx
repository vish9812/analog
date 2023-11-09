import useJumper from "./useJumper";

interface Props {
  onTimeJump: (jumpID: string) => void;
}

function useViewModel(props: Props) {
  const { jump, nextEmpty, prevEmpty } = useJumper;

  function handleJump(next: boolean) {
    props.onTimeJump(jump(next));
  }

  return {
    nextEmpty,
    prevEmpty,
    handleJump,
  };
}

export default useViewModel;
export type { Props };
