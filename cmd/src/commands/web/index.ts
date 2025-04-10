import path from "path";
import { parseArgs } from "util";

const DEFAULT_PORT = 20002;
const DIST_PATH = path.join(import.meta.dir, "dist"); // Assuming dist is at the project root relative to cmd/src/commands/web

async function run() {
  // Parse args specifically for the web command
  const { values: flags } = parseArgs({
    args: Bun.argv.slice(3), // Slice off node, script path, and command name ('web' or '-w')
    options: {
      port: {
        type: "string", // Parse as string, validate later
        short: "p",
      },
    },
    strict: false, // Allow other args potentially
    allowPositionals: true,
  });

  let port = DEFAULT_PORT;
  if (flags.port) {
    const parsedPort = parseInt(flags.port as string, 10);
    if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort < 65536) {
      port = parsedPort;
    } else {
      console.warn(
        `Invalid port "${flags.port}" provided. Using default ${DEFAULT_PORT}.`
      );
    }
  }

  console.log(`Serving static files from: ${DIST_PATH}`);

  try {
    const server = Bun.serve({
      port: port,
      async fetch(req) {
        const url = new URL(req.url);
        let filePath = path.join(DIST_PATH, url.pathname);

        // If requesting root, serve index.html
        if (url.pathname === "/" || url.pathname === "") {
          filePath = path.join(DIST_PATH, "index.html");
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

    // Keep the process running
    // Note: Bun doesn't automatically keep the process alive for Bun.serve
    // A common pattern is to use an interval that does nothing,
    // or handle signals if more complex shutdown logic is needed.
    setInterval(() => {}, 1 << 30); // Keep alive indefinitely
  } catch (e) {
    console.error("Failed to start server:", e);
    if (e instanceof Error && "code" in e && e.code === "EADDRINUSE") {
      console.error(`
Error: Port ${port} is already in use.`);
      console.error(
        `Please try a different port using the --port flag, e.g.: bun run cmd/src/main.ts --web --port ${
          port + 1
        }`
      );
    }
    process.exit(1);
  }
}

function help() {
  console.log(`
Usage: bun run ./cmd/src/main.ts --web [options]

Starts a web server to serve the Analog UI.

Options:

  -p, --port <number>    Specify the port number to run the server on.
                         (Default: ${DEFAULT_PORT})

Example:

  bun run ./cmd/src/main.ts --web --port 8080
  `);
}

export default { run, help };
