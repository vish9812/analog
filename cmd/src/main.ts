import { parseArgs } from "util";
// @ts-ignore
import figlet from "figlet";
import Filterer from "./commands/filterer";
import Summary from "./commands/summary";
import type { ICmd } from "./utils/cmd-runner";

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
  
  Usage:
  
    bun run ./cli/main.js <commands> [arguments]

  The commands are:
    
    -s, --summary             
          provides a summary view of all the log files.
    
    -f, --filter              
          filters all files from a given folder within a time range and generate a single time-sorted log file.

  Use "bun run ./cli/main.js --help <command>" for more information about a command.
  
  Example: 
    
    bun run ./cli/main.js --help --filter

  Caution:  Processing multiple files will need at least twice the space as the logs files size.
            For example, if you are analyzing 4GB of logs make sure you have 8GB of *free* RAM left for smoother processing.
  `);
}
