import useViewModel, { Props } from "./useViewModel";

function Download(props: Props) {
  const { downloadSubset } = useViewModel(props);

  return (
    <button class="btn-outline gap-2" onClick={downloadSubset}>
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
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Download Subset
    </button>
  );
}

export default Download;
