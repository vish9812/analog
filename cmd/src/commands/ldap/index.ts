import { parseArgs } from "util";
import type { ICmd } from "@al/cmd/utils/cmd-runner";
import { defaultFlags } from "./types";
import type { Flags } from "./types";
import handleUserSearch from "./search-user";
import handleGroupPaths from "./group-paths";
import handleComparison from "./compare";

const flags: Flags = { ...defaultFlags };

function help(): void {
  console.log(`
Parses LDAP log files to find all group membership paths for a specific user and job ID, or search for users based on various criteria.

Usage:

  ./analog --ldap [arguments]

The command operates in three modes:

1. Interactive Mode:
   Run with "-i" or "--interactive" flag to enter interactive mode:
   ./analog --ldap -i

   This mode allows you to:
   - Search for user attributes in login or job response blocks
   - Filter by specific job ID
   - Search by user CN or multiple attributes (email, name, etc.)
   - Specify time ranges for the search
   Note: Interactive flag takes precedence over all other mode flags.

2. Non-interactive Mode:
   Run with "--jobId" and "--user" arguments to find group membership paths:

3. Comparison Mode:
   Run with "--jobId", "--compareJobId", and "--user" arguments to compare LDAP data between two jobs:

Mode-specific arguments:

  -i, --interactive
        Enter interactive mode. Takes precedence over other mode flags.

  -j, --jobId
        (Required for non-interactive/comparison mode) Specifies the job ID to filter the logs by.

  -u, --user        
        (Required for non-interactive/comparison mode) Specifies the user CN (Common Name) to find paths for.

  -c, --compareJobId
        Specifies a second job ID to compare against the first job.
        When provided without -i flag, runs in comparison mode.

Common arguments for all modes:

  -p, --path
        Specifies the path to either a single log file or a folder containing log files.
        If a folder is provided, it traverses all the files in the folder and its subfolders.
        If a file is provided, then prefix and suffix flags are ignored.
        Default: . (current directory)

  --prefix
        Specifies the prefix for the log files to include.
        Default: ldap

  --suffix
        Specifies the suffix for the log files to include.
        Default: log

Examples:

  1. Interactive mode:
     ./analog --ldap -i -p /path/to/ldap/logs

  2. Non-interactive mode (find groups to user paths):
     ./analog --ldap -j wsqt9pbpa7yz8gdssw47xzn8hw -u "John Doe" -p /path/to/ldap/logs/specific.log

  3. Comparison mode:
     ./analog --ldap -j wsqt9pbpa7yz8gdssw47xzn8hw -c e6frspwx9fgs7y7mmo3o5s5cmh -u "John Doe" -p /path/to/ldap/logs
  `);
}

// returns true if interactive mode, false if non-interactive or comparison mode
function parseFlags(): boolean {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      ldap: {
        type: "boolean",
        short: "l",
      },
      interactive: {
        type: "boolean",
        short: "i",
      },
      jobId: {
        type: "string",
        short: "j",
      },
      compareJobId: {
        type: "string",
        short: "c",
      },
      user: {
        type: "string",
        short: "u",
      },
      path: {
        type: "string",
        short: "p",
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
  flags.compareJobId = String(values.compareJobId ?? "");
  flags.userCN = String(values.user ?? "");
  flags.path = String(values.path ?? flags.path);
  flags.prefix = String(values.prefix ?? flags.prefix);
  flags.suffix = String(values.suffix ?? flags.suffix);

  // Check for interactive flag first - it takes precedence
  if (values.interactive) {
    return true;
  }

  // non-interactive or comparison mode
  if (!flags.jobId) {
    console.error("Error: --jobId flag is required for non-interactive mode.");
    help();
    process.exit(1);
  }
  if (!flags.userCN) {
    console.error(
      "Error: --user (-u) flag is required for non-interactive mode."
    );
    help();
    process.exit(1);
  }

  return false;
}

async function run(): Promise<void> {
  const interactive = parseFlags();
  if (interactive) {
    console.log("Running in interactive mode...\n");
    await handleUserSearch(flags);
    return;
  }

  // Check if comparison mode
  if (flags.compareJobId) {
    await handleComparison(flags);
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
