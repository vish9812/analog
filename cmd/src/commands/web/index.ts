import path from "path";
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

  bun run ./cmd/src/main.ts --web [arguments]

The arguments are:

  -p, --port 
        Specify the port number to run the server on.
        Default: ${flags.port}

Example:

  bun run ./cmd/src/main.ts --web --port 8080
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
    strict: false,
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
  const distPath = path.join(import.meta.dir, "./dist");
  const indexPath = path.join(distPath, "index.html");
  const distPathExists = await Bun.file(indexPath).exists();

  if (!distPathExists) {
    console.error(`Dist folder not found at: ${distPath}`);
    process.exit(1);
  }

  console.log(`Serving static files from: ${distPath}`);

  try {
    const server = Bun.serve({
      port: flags.port,
      async fetch(req) {
        const url = new URL(req.url);
        let filePath = path.join(distPath, url.pathname);

        // If requesting root, serve index.html
        if (url.pathname === "/" || url.pathname === "") {
          filePath = indexPath;
        }

        const file = Bun.file(filePath);
        const exists = await file.exists();

        if (exists) {
          return new Response(file);
        } else {
          // Optional: Serve a 404 page or just return a 404 response
          console.log(`File not found: ${filePath}`);
          return new Response("Not Found", { status: 404 });
        }
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
