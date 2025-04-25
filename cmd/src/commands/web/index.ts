// --- BEGIN GENERATED IMPORTS - DO NOT EDIT MANUALLY ---
import fileIndexHtml from "./dist/index.html" with { type: "file" };
import fileIndexCss from "./dist/assets/index-BYz9Op3u.css" with { type: "file" };
import fileIndexJs from "./dist/assets/index-DwsdYal3.js" with { type: "file" };
import fileFavicon from "./dist/assets/favicon-mtvwWgEY.ico" with { type: "file" };
// --- END GENERATED IMPORTS ---

import { parseArgs } from "util";
import type { ICmd } from "@al/cmd/utils/cmd-runner";

const DEFAULT_PORT = 20002;
const flags = {
  port: DEFAULT_PORT,
};

function help(): void {
  console.log(`
Starts a web server to serve the Analog UI.

Usage: 

  ./analog --web [arguments]

The arguments are:

  -p, --port 
        Specify the port number to run the server on.
        Default: ${flags.port}

Example:

  ./analog --web --port 8080
  `);
}

async function run(): Promise<void> {
  parseFlags();
  await startServer();
}

function parseFlags() {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      web: {
        type: "boolean",
        short: "w",
      },
      port: {
        type: "string",
        short: "p",
        default: String(flags.port),
      },
    },
    strict: true,
    allowPositionals: true,
  });

  // Parse port, with validation
  const parsedPort = parseInt(String(values.port), 10);
  if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort < 65536) {
    flags.port = parsedPort;
  } else if (values.port !== String(DEFAULT_PORT)) {
    console.warn(
      `Invalid port "${values.port}" provided. Using default ${DEFAULT_PORT}.`
    );
  }
}

async function startServer() {
  try {
    const server = Bun.serve({
      port: flags.port,
      async fetch(req) {
        const url = new URL(req.url);
        let file;

        // If requesting root, serve index.html
        if (url.pathname === "/" || url.pathname === "") {
          file = fileIndexHtml;
        } else if (url.pathname.endsWith(".css")) {
          file = fileIndexCss;
        } else if (url.pathname.endsWith(".js")) {
          file = fileIndexJs;
        } else if (url.pathname.endsWith(".ico")) {
          file = fileFavicon;
        } else {
          console.log(`No file available for: ${url.pathname}. Serving index.html instead.`);
          file = fileIndexHtml;
        }

        return new Response(Bun.file(file));
      },
      error(error) {
        console.error("Server error:", error);
        return new Response("Internal Server Error", { status: 500 });
      },
    });

    console.log(`
✅ Web server started successfully!`);
    console.log(`   Serving UI from dist folder at: http://localhost:${server.port}
`);
    console.log("   Press Ctrl+C to stop the server.");
  } catch (e) {
    console.error("Failed to start server:", e);
    if (e instanceof Error && "code" in e && e.code === "EADDRINUSE") {
      console.error(`
Error: Port ${flags.port} is already in use.`);
      console.error(
        `Please try a different port using the --port flag, e.g.: bun run cmd/src/main.ts --web --port ${
          flags.port + 1
        }`
      );
    }
    process.exit(1);
  }
}

const web: ICmd = {
  help,
  run,
};

export default web;
