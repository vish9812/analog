import { RouteSectionProps, useLocation } from "@solidjs/router";
import { createEffect, createSignal } from "solid-js";

const Layout = (props: RouteSectionProps<unknown>) => {
  const [isDarkMode, setIsDarkMode] = createSignal(
    localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  const location = useLocation();
  const isAnalyzePage = () => location.pathname === "/analyze";

  createEffect(() => {
    const theme = isDarkMode() ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
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
      </header>
      <main class={`${isAnalyzePage() ? "" : "container mx-auto px-6"} py-8`}>
        <div class={isAnalyzePage() ? "" : "max-w-5xl mx-auto space-y-6"}>
          {props.children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
