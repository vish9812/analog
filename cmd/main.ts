import { parseArgs } from "util";
import type { ICmd } from "./utils/cmd-runner";
import Filterer from "./filterer";
import Summary from "./summary";
// @ts-ignore
import figlet from "figlet";

let cmd: ICmd;
let isHelp = false;

const { values: flags } = parseArgs({
  args: Bun.argv,
  options: {
    help: {
      type: "boolean",
      short: "h",
    },
    filter: {
      type: "boolean",
      short: "f",
    },
    summary: {
      type: "boolean",
      short: "s",
    },
  },
  strict: false,
  allowPositionals: true,
});

if (typeof flags.help === "boolean" && flags.help) {
  isHelp = true;
}

if (typeof flags.filter === "boolean" && flags.filter) {
  cmd = new Filterer();
} else if (typeof flags.summary === "boolean" && flags.summary) {
  cmd = new Summary();
} else {
  help();
  process.exit(0);
}

if (isHelp) {
  cmd.help();
} else {
  console.log("========Started========");
  await cmd.run();
  console.log("========Finished========");
}

// TODO: Bug: Something is keeping the main process alive, so exiting forcefully.
console.log("Beyonder...");
process.exit(0);

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
  Run analog as cli for analyzing multiple log files.
  [Bun](https://bun.sh/docs/installation) tool is needed to run as cli.
  
  Usage:
  
    bun run ./cli/main.js <commands> [arguments]

  The commands are:
    
    --filter(-f)           filters all files from a given folder within a time range and generate a single time-sorted log file.

    --summary(-s)          provides a summary view of all the log files.

  Use "bun run ./cli/main.js --help <command>" for more information about a command.
  Example: bun run ./cli/main.js --help --filter

  Caution: Processing multiple files will need at least twice the space as the logs files size.
            For example, if you are analyzing 4GB of logs make sure you have 8GB of *free* RAM left for smoother processing.
  `);
}
