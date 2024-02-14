import { parseArgs } from "util";
import type { ICmd } from "./common";
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
  await cmd.run();
  console.log("========Finished========");
}

// TODO: Bug: Something is keeping the main process alive, so exiting forcefully.
console.log("Beyonder....");
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
  analog is a cli for managing the log files.
  
  Usage:
  
    analog <commands> [arguments]

  The commands are:
    
    --filter(-f)           filters all files from a given folder within a time range and generate a single time-sorted log file.

    --summary(-s)          provides a summary view of all the log files.

  Use "analog --help(-h) <command>" for more information about a command.

  Caution: Currently, the CLI doesn't support the parallel processing of the files which would be much faster.
           To utilize the parallelization, clone the repository and use [Bun](https://bun.sh/docs/installation) directly to process the log files.
           To execute commands, replace "analog" with "bun run ./src/cmd/index.ts".
           Example: bun run ./src/cmd/index.ts --help --filter
  `);
}
