import { parseArgs } from "util";
// @ts-ignore
import figlet from "figlet";
import merger from "./commands/merger";
import summary from "./commands/summary";
import web from "./commands/web";
import type { ICmd } from "./utils/cmd-runner";

// Handle Ctrl-C
process.on("SIGINT", () => {
  console.log("\nCtrl-C was pressed, exiting...\n");
  process.exit(0);
});

let cmd: ICmd;
let isHelp = false;

const { values: flags } = parseArgs({
  args: Bun.argv,
  options: {
    help: {
      type: "boolean",
      short: "h",
    },
    merger: {
      type: "boolean",
      short: "m",
    },
    summary: {
      type: "boolean",
      short: "s",
    },
    web: {
      type: "boolean",
      short: "w",
    },
  },
  strict: false,
  allowPositionals: true,
});

if (typeof flags.help === "boolean" && flags.help) {
  isHelp = true;
}

if (typeof flags.merger === "boolean" && flags.merger) {
  cmd = merger;
} else if (typeof flags.summary === "boolean" && flags.summary) {
  cmd = summary;
} else if (typeof flags.web === "boolean" && flags.web) {
  cmd = web;
} else {
  if (isHelp) {
    help();
    process.exit(0);
  }
  console.error("Error: No valid command specified.\n");
  help();
  process.exit(1);
}

if (isHelp && cmd) {
  cmd.help();
} else if (cmd) {
  console.log("========Started========\n");
  await cmd.run();
  console.log("\n========Finished========");
}

function help() {
  console.log(figlet.textSync(`ANALOG`));
  console.log(`
                         .="=.
                      _/.-.-.\\_     _
                     ( ( o o ) )    ))
                      |/  "  \\|    //
      .-------.        \\'---'/    //
     _|~~ ~~  |_       /'"""'\\\\  ((
   =(_|_______|_)=    / /_,_\\ \\\\  \\\\
     |:::::::::|      \\_\\\\_'__/ \\  ))
     |:::::::[]|       /'  /'~\\  |//
     |o=======.|      /   /    \\  /
    '"""""""""'  ,--',--'\\/\\    /
                   '-- "--'  '--'
  `);

  console.log(`
Run analog as cli for analyzing multiple log files or serving the UI.

Usage:

  bun run ./cmd/src/main.ts <command> [arguments]

The commands are:

  -m, --merger
        merges all files from a given folder within a time range and generate a single time-sorted log file with unique log entries.

  -s, --summary
        provides a summary view of all the log files.

  -w, --web
        starts a web server to serve the Analog UI from the 'dist' folder.

Use "bun run ./cmd/src/main.ts --help --<command>" for more information about a command.
e.g. bun run ./cmd/src/main.ts --help --merger

Example:

  bun run ./cmd/src/main.ts --web --port 8080
  bun run ./cmd/src/main.ts --merger --inFolderPath ../../logs --outFileName merged.log

Caution (for merger/summary): Processing multiple files will need at least twice the space as the logs files size.
          For example, if you are analyzing 4GB of logs make sure you have 8GB of *free* RAM left for smoother processing.

A few utility commands can also be found here - https://github.com/vish9812/analog?tab=readme-ov-file#utility-commands.
  `);
}
