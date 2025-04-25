import { JSX, Show } from "solid-js";
import usePage, { Pages } from "./usePage";
import comparer from "@al/services/comparer";

interface LayoutProps {
  children: JSX.Element;
}

// Component to display file name(s)
const FileNameDisplay = () => {
  const isComparison = comparer.isOn();
  const firstFile = comparer.first()?.fileInfo?.name || "";
  const lastFile = comparer.last()?.fileInfo?.name || "";

  return (
    <div class="text-center flex-1 px-4">
      {isComparison ? (
        <div class="flex items-center justify-center gap-3">
          <span class="font-medium text-gray-600">{firstFile}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
          <span class="font-medium text-gray-600">{lastFile}</span>
        </div>
      ) : (
        <span class="font-medium text-gray-600">{lastFile}</span>
      )}
    </div>
  );
};

const Layout = (props: LayoutProps) => {
  const { page } = usePage();
  const isAnalyzePage = () => page() === Pages.analyze;

  return (
    <div class="min-h-screen bg-surface">
      <header class="bg-background shadow-lg">
        <div class="container mx-auto px-6 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Analog
              </h1>
              <p class="text-text-light mt-1">Analyze Logs with Ease</p>
            </div>

            {/* Show file names only on the analyze page */}
            <Show when={isAnalyzePage()}>
              <FileNameDisplay />
            </Show>

            <div class="flex items-center space-x-2">
              <div class="relative group">
                <button
                  type="button"
                  class="btn-outline btn-sm rounded-full"
                  onClick={() => window.location.reload()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                </button>
                <span class="tooltip">Reload Page</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main
        class={`${
          page() === Pages.analyze ? "" : "container mx-auto px-6"
        } py-8`}
      >
        <div>{props.children}</div>
      </main>
    </div>
  );
};

export default Layout;
