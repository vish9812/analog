import { parseArgs } from "util";
import type { ICmd } from "@al/cmd/utils/cmd-runner";
import { defaultFlags } from "./types";
import type { Flags } from "./types";
import handleUserSearch from "./search-user";
import handleGroupPaths from "./group-paths";

const flags: Flags = { ...defaultFlags };

function help(): void {
  console.log(`
Parses LDAP log files to find all group membership paths for a specific user and job ID, or search for users based on various criteria.

Usage:

  ./analog --ldap [arguments]

The command operates in two modes:

1. Interactive Mode:
   Run without "--jobId" and "--user" arguments to enter interactive mode:

   This mode allows you to:
   - Search for user attributes in login or job response blocks
   - Filter by specific job ID
   - Search by user CN or multiple attributes (email, name, etc.)
   - Specify time ranges for the search

2. Non-interactive Mode:
   Run with "--jobId" and "--user" arguments to find group membership paths:

The arguments for non-interactive mode only:

  -j, --jobId
        (Required) Specifies the job ID to filter the logs by.

  -u, --user        
        (Required) Specifies the user CN (Common Name) to find paths for.

Common arguments for both modes:

  -i, --inFolderPath
        Specifies the path to the folder containing the LDAP log files.
        The folder should only contain log files or nested folders with log files.
        Default: . (current directory)

  --prefix
        Specifies the prefix for the log files to include.
        Default: ldap

  --suffix
        Specifies the suffix for the log files to include.
        Default: log

Examples:

  1. Interactive mode:
     ./analog --ldap -i /path/to/ldap/logs

  2. Non-interactive mode (find group paths):
     ./analog --ldap -j wsqt9pbpa7yz8gdssw47xzn8hw -u "John Doe" -i /path/to/ldap/logs
  `);
}

// returns true if interactive mode, false if non-interactive mode
function parseFlags(): boolean {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      ldap: {
        type: "boolean",
        short: "l",
      },
      jobId: {
        type: "string",
        short: "j",
      },
      user: {
        type: "string",
        short: "u",
      },
      inFolderPath: {
        type: "string",
        short: "i",
      },
      prefix: {
        type: "string",
      },
      suffix: {
        type: "string",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  flags.jobId = String(values.jobId ?? "");
  flags.userCN = String(values.user ?? "");
  flags.inFolderPath = String(values.inFolderPath ?? flags.inFolderPath);
  flags.prefix = String(values.prefix ?? flags.prefix);
  flags.suffix = String(values.suffix ?? flags.suffix);

  const interactive = !flags.jobId && !flags.userCN;

  if (interactive) {
    console.log("No flags provided, running in interactive mode...\n");
    return true;
  }

  // non-interactive mode
  if (!flags.jobId) {
    console.error("Error: --jobId flag is required.");
    help();
    process.exit(1);
  }
  if (!flags.userCN) {
    console.error("Error: --user (-u) flag is required.");
    help();
    process.exit(1);
  }

  return false;
}

async function run(): Promise<void> {
  const interactive = parseFlags();
  if (interactive) {
    console.log("No flags provided, running in interactive mode...\n");
    await handleUserSearch(flags);
    return;
  }

  // non-interactive mode
  handleGroupPaths(flags);
}

const ldapCmd: ICmd = {
  help,
  run,
};

export default ldapCmd;
