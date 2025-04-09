import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";
import devtools from "solid-devtools/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    /* 
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
    devtools({ autoname: true }),
    tailwindcss(),
    solidPlugin(),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
    outDir: "analog",
  },
  test: {
    environment: "jsdom",
    globals: true,
    testTransformMode: { web: ["/.[jt]sx?$/"] },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
