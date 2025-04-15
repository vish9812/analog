import { getSortedLines } from "./helper";
import type { FileLines, Flags } from "./types";

interface PathsResult {
  paths: string[][]; // All paths ending at the target user
  cycleGroups: Set<string>; // Unique groups that are part of a cycle
  groupsLeadingToUser: Set<string>; // Unique groups that eventually lead to the target user
}

type GroupMap = Map<string, Set<string>>;

const patterns = {
  cn: /CN=([^,]+)/,
  member: /member/,
};

async function handleGroupPaths(flags: Flags): Promise<void> {
  console.log("\n========= Parsing Logs =========");
  const fileLines: FileLines[] = await getSortedLines(flags);
  const groupUserCNs = parseLogs(fileLines, flags.jobId);
  console.log("========= Finished Parsing Logs =========");

  if (groupUserCNs.size === 0) {
    console.log(
      `No group information found for job ID "${flags.jobId}" in the processed files.`
    );
    return;
  }

  console.log(`\n========= Finding Paths for User: ${flags.userCN} =========`);
  const pathsResults = createPathsToUser(groupUserCNs, flags.userCN);
  console.log(`========= Finished Finding Paths =========`);

  printResults(pathsResults, flags);
}

function printResults(pathsResults: PathsResult, flags: Flags) {
  const { paths, cycleGroups, groupsLeadingToUser } = pathsResults;
  if (paths.length === 0) {
    console.log(
      `User "${flags.userCN}" not found in any group memberships for job ID "${flags.jobId}" in the processed files.`
    );
    return;
  }

  const sortedPaths = paths
    .map((path) => path.join(" -> "))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  console.log(`Found ${sortedPaths.length} paths to user ${flags.userCN}:`);
  console.log(sortedPaths.join("\n"));

  console.log("\n---");
  console.log(`Found ${cycleGroups.size} cyclic groups involved in paths:`);
  console.log(Array.from(cycleGroups).join(", "));

  console.log("\n---");
  console.log(
    `Found ${groupsLeadingToUser.size} unique groups leading to user ${flags.userCN}:`
  );
  console.log(Array.from(groupsLeadingToUser).join(", "));
}

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

function parseLogs(fileLines: FileLines[], jobId: string): GroupMap {
  const groupUserCNs: GroupMap = new Map<string, Set<string>>();
  const responseIdentifier = `Got response worker_name=EnterpriseLdapSync job_id=${jobId}`;

  let gotResponse = false;
  let currentGroupCN: string | null = null;
  let isProcessingMembers = false;
  let foundMemberAttribute = false;

  const lines = fileLines.flatMap((fileLine) => fileLine.lines);

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
        groupUserCNs.get(currentGroupCN)?.add(memberCN);
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

export default handleGroupPaths;
