import useViewModel, { Props } from "./useViewModel";

function TimeJumps(props: Props) {
  const { handleJump, nextEmpty, prevEmpty } = useViewModel(props);

  return (
    <div class="join">
      <button
        class="join-item btn btn-sm"
        disabled={prevEmpty()}
        onClick={() => handleJump(false)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
          />
        </svg>
      </button>
      <div
        class="tooltip"
        data-tip="Navigate through log data in subsets whenever there is a time break of certain minutes"
      >
        <button class="join-item p-2">Time Jumps</button>
      </div>
      <button
        class="join-item btn btn-sm"
        disabled={nextEmpty()}
        onClick={() => handleJump(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 5l7 7-7 7M5 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}

export default TimeJumps;
