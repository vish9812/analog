import { parseArgs } from "util";
import type { ICmd } from "@al/cmd/utils/cmd-runner";
import fileHelper from "@al/cmd/utils/file-helper";

// --- Logic adapted from .ai/parser2.ts ---

const patterns = {
  cn: /CN=([^,]+)/,
  member: /member/,
};

type GroupMap = Map<string, Set<string>>;

interface PathsResult {
  paths: string[][]; // All paths ending at the target user
  cycleGroups: Set<string>; // Unique groups that are part of a cycle
  groupsLeadingToUser: Set<string>; // Unique groups that eventually lead to the target user
}

/**
 * Iterative DFS that finds all paths to a target user, while maintaining:
 * - A set of groups involved in cycles.
 * - A set of groups that eventually lead to the user.
 */
function createPathsToUser(
  groupUserCNs: GroupMap,
  userCN: string
): PathsResult {
  const paths: string[][] = [];
  const cycleGroups = new Set<string>();
  const groupsLeadingToUser = new Set<string>();

  // Run iterative DFS starting from every group key.
  for (const group of groupUserCNs.keys()) {
    // Each stack entry stores the current group and the path taken so far.
    const stack: { group: string; currentPath: string[] }[] = [
      { group, currentPath: [group] },
    ];

    while (stack.length > 0) {
      const { group: current, currentPath } = stack.pop()!;

      const members = groupUserCNs.get(current);
      if (!members) continue;

      for (const member of members) {
        // Check for cycles in the current path.
        if (currentPath.includes(member)) {
          cycleGroups.add(member);
          continue;
        }

        // If we find the target user, record the valid path.
        if (member === userCN) {
          const validPath = [...currentPath, member];
          paths.push(validPath);
          // Mark all groups along this path as leading to the target.
          for (const grp of currentPath) {
            groupsLeadingToUser.add(grp);
          }
        }

        // If the member is also a group, continue DFS.
        if (groupUserCNs.has(member)) {
          stack.push({ group: member, currentPath: [...currentPath, member] });
        }
      }
    }
  }

  return { paths, cycleGroups, groupsLeadingToUser };
}

// Parses LDAP log lines and extracts group membership information
function parseLDAPLog(lines: string[], jobId: string): GroupMap {
  const groupUserCNs = new Map<string, Set<string>>();
  const responseIdentifier = `Got response worker_name=EnterpriseLdapSync job_id=${jobId}`;

  let currentGroupCN: string | null = null;
  let isProcessingMembers = false;
  let foundMemberAttribute = false;
  let gotResponse = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Look for the start of a new LDAP response for the specific job ID
    if (line.includes(responseIdentifier)) {
      gotResponse = true;
      currentGroupCN = null;
      isProcessingMembers = false;
      foundMemberAttribute = false;
      continue;
    }

    if (!gotResponse) continue;

    // Look for Object Name line to get the group CN
    if (line.startsWith("Object Name:")) {
      const cnMatch = line.match(patterns.cn);
      if (cnMatch && cnMatch[1]) {
        currentGroupCN = cnMatch[1];
        if (!groupUserCNs.has(currentGroupCN)) {
          groupUserCNs.set(currentGroupCN, new Set());
        }
        isProcessingMembers = false; // Reset processing state for the new object
        foundMemberAttribute = false;
      }
      continue;
    }

    // Look for the member attribute within the current group context
    if (line.startsWith("Attribute Name:") && line.match(patterns.member)) {
      foundMemberAttribute = true;
      continue;
    }

    // Process member values if the member attribute was found
    if (foundMemberAttribute && line.startsWith("Attribute Values:")) {
      isProcessingMembers = true;
      continue;
    }

    if (isProcessingMembers && line.startsWith("Attribute Value:")) {
      const cnMatch = line.match(patterns.cn);
      if (cnMatch && currentGroupCN) {
        const memberCN = cnMatch[1];
        groupUserCNs.get(currentGroupCN)?.add(memberCN); // Use optional chaining
      }
      continue;
    }

    // If we are processing members but the line is not an Attribute Value,
    // it means the member section ended. Reset flags.
    // Also reset gotResponse as we might encounter logs for other jobs.
    if (isProcessingMembers && !line.startsWith("Attribute Value:")) {
      isProcessingMembers = false;
      foundMemberAttribute = false;
      gotResponse = false; // Reset to look for the next relevant response block
    }
  }

  console.log(
    `Successfully parsed ${groupUserCNs.size} groups from LDAP log for job ${jobId}`
  );
  return groupUserCNs;
}

// --- CLI Command Specific Logic ---

const flags = {
  jobId: "",
  userCN: "",
  inFolderPath: ".",
  prefix: "ldap",
  suffix: "log",
};

function help(): void {
  console.log(`
Parses LDAP log files to find all group membership paths for a specific user and job ID.

Usage:

  bun run ./cli/main.js --ldap [arguments]

The arguments are:

  --jobId           (Required) Specifies the job ID to filter the logs by.

  -u, --user        (Required) Specifies the user CN (Common Name) to find paths for.

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

Example:

  bun run ./cli/main.js --ldap --jobId "wsqt9pbpa7yz8gdssw47xzn8hw" -u "John Doe" -i "/path/to/ldap/logs"
  `);
}

async function run(): Promise<void> {
  parseFlags();

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

  await processLogs();
}

function parseFlags() {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      ldap: {
        // Consumed by main.ts
        type: "boolean",
        short: "l",
      },
      jobId: {
        type: "string",
      },
      user: {
        type: "string",
        short: "u",
      },
      inFolderPath: {
        type: "string",
        short: "i",
        default: flags.inFolderPath,
      },
      prefix: {
        type: "string",
        default: flags.prefix,
      },
      suffix: {
        type: "string",
        default: flags.suffix,
      },
    },
    strict: false,
    allowPositionals: true,
  });

  flags.inFolderPath = String(values.inFolderPath ?? flags.inFolderPath);
  flags.prefix = String(values.prefix ?? flags.prefix);
  flags.suffix = String(values.suffix ?? flags.suffix);
  flags.jobId = String(values.jobId ?? "");
  flags.userCN = String(values.user ?? "");
}

async function processLogs() {
  const filePaths = await fileHelper.getFilesRecursively(
    flags.inFolderPath,
    flags.prefix,
    flags.suffix
  );

  if (filePaths.length === 0) {
    console.log(
      `No files found matching prefix "${flags.prefix}" and suffix "${flags.suffix}" in "${flags.inFolderPath}". Exiting.`
    );
    process.exit(0);
  }

  console.log(
    `Found ${filePaths.length} files matching prefix "${flags.prefix}" and suffix "${flags.suffix}" in "${flags.inFolderPath}"`
  );

  console.log("========= Reading Files =========");
  let allLines: string[] = [];
  for (const filePath of filePaths) {
    console.log(`Reading: ${filePath}`);
    try {
      const content = await Bun.file(filePath).text();
      allLines = allLines.concat(content.split(/\r?\n/));
    } catch (err) {
      console.error(`Error reading file ${filePath}:`, err);
    }
  }
  console.log(`Read total ${allLines.length} lines.`);
  console.log("========= Finished Reading Files =========");

  console.log("========= Parsing Logs =========");
  const groupUserCNs = parseLDAPLog(allLines, flags.jobId);
  console.log("========= Finished Parsing Logs =========");

  if (groupUserCNs.size === 0) {
    console.log(`No group information found for job ID "${flags.jobId}".`);
    process.exit(0);
  }

  console.log(`========= Finding Paths for User: ${flags.userCN} =========`);
  const { paths, cycleGroups, groupsLeadingToUser } = createPathsToUser(
    groupUserCNs,
    flags.userCN
  );

  if (paths.length === 0) {
    console.log(
      `User "${flags.userCN}" not found in any group memberships for job ID "${flags.jobId}".`
    );
  } else {
    console.log(`Found ${paths.length} paths to user ${flags.userCN}:`);
    console.log(paths.map((path) => path.join(" -> ")).join("\n"));
    console.log("\n---");
    console.log(`Found ${cycleGroups.size} cyclic groups involved in paths:`);
    console.log(Array.from(cycleGroups).join(", "));
    console.log("\n---");
    console.log(
      `Found ${groupsLeadingToUser.size} unique groups leading to user ${flags.userCN}:`
    );
    console.log(Array.from(groupsLeadingToUser).join(", "));
  }
  console.log(`========= Finished Finding Paths =========`);
}

const ldapCmd: ICmd = {
  help,
  run,
};

export default ldapCmd;
