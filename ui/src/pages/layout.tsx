import { createEffect, createSignal, JSX, Show } from "solid-js";
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
          <span class="font-medium text-base-content/80">{firstFile}</span>
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
          <span class="font-medium text-base-content/80">{lastFile}</span>
        </div>
      ) : (
        <span class="font-medium text-base-content/80">{lastFile}</span>
      )}
    </div>
  );
};

const Layout = (props: LayoutProps) => {
  const [isDarkMode, setIsDarkMode] = createSignal(
    localStorage.getItem("analog-theme") === "dark" ||
      (!localStorage.getItem("analog-theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  const { page } = usePage();
  const isAnalyzePage = () => page() === Pages.analyze;

  createEffect(() => {
    const theme = isDarkMode() ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("analog-theme", theme);
  });

  return (
    <div class="min-h-screen bg-base-200 transition-colors duration-200">
      <header class="bg-base-100 shadow-lg">
        <div class="container mx-auto px-6 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Analog
              </h1>
              <p class="text-base-content/70 mt-1">Analyze Logs with Ease</p>
            </div>

            {/* Show file names only on the analyze page */}
            <Show when={isAnalyzePage()}>
              <FileNameDisplay />
            </Show>

            <div class="flex items-center space-x-2">
              <div
                class="tooltip tooltip-bottom tooltip-error"
                data-tip="Reload Page"
              >
                <button
                  type="button"
                  class="btn btn-circle btn-ghost"
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
              </div>

              <button
                type="button"
                class="btn btn-circle btn-ghost"
                onClick={() => setIsDarkMode(!isDarkMode())}
              >
                {isDarkMode() ? (
                  <svg
                    class="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                  </svg>
                ) : (
                  <svg
                    class="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
                <span class="sr-only">Toggle dark mode</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <main
        class={`${
          page() === Pages.analyze ? "" : "container mx-auto px-6"
        } py-8`}
      >
        <div
          class={page() === Pages.analyze ? "" : "max-w-5xl mx-auto space-y-6"}
        >
          {props.children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
