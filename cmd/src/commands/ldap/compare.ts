import type { Flags } from "./types";
import {
  parseLogs as parseGroupLogs,
  type PathsResult,
  createPathsToUser,
} from "./group-paths";
import { parseLogs as parseUserLogs, type SearchResult } from "./search-user";
import { getSortedLines } from "./helper";

interface ComparisonResult {
  userAttributeDiffs: {
    job1: Record<string, string>;
    job2: Record<string, string>;
  };
  pathDiffs: {
    onlyInJob1: string[][];
    onlyInJob2: string[][];
  };
  groupDiffs: {
    onlyInJob1: Set<string>;
    onlyInJob2: Set<string>;
  };
}

function compareAttributes(
  result1: SearchResult | null,
  result2: SearchResult | null
): ComparisonResult["userAttributeDiffs"] {
  const diffs = {
    job1: {} as Record<string, string>,
    job2: {} as Record<string, string>,
  };

  // If either result is null, treat all attributes from the other as different
  if (!result1 || !result2) {
    if (result1) {
      diffs.job1 = { ...result1.attributes };
    }
    if (result2) {
      diffs.job2 = { ...result2.attributes };
    }
    return diffs;
  }

  // Compare attributes and collect differences
  const allKeys = new Set([
    ...Object.keys(result1.attributes),
    ...Object.keys(result2.attributes),
  ]);

  for (const key of allKeys) {
    const val1 = result1.attributes[key];
    const val2 = result2.attributes[key];

    if (val1 !== val2) {
      if (val1 !== undefined) diffs.job1[key] = val1;
      if (val2 !== undefined) diffs.job2[key] = val2;
    }
  }

  return diffs;
}

function comparePaths(
  paths1: PathsResult,
  paths2: PathsResult
): Pick<ComparisonResult, "pathDiffs" | "groupDiffs"> {
  const pathDiffs = {
    onlyInJob1: [] as string[][],
    onlyInJob2: [] as string[][],
  };

  const groupDiffs = {
    onlyInJob1: new Set<string>(),
    onlyInJob2: new Set<string>(),
  };

  // Convert paths to strings for easier comparison
  const pathStrings1 = new Set(paths1.paths.map((p) => p.join(" -> ")));
  const pathStrings2 = new Set(paths2.paths.map((p) => p.join(" -> ")));

  // Find paths unique to job1
  for (const path of paths1.paths) {
    const pathStr = path.join(" -> ");
    if (!pathStrings2.has(pathStr)) {
      pathDiffs.onlyInJob1.push(path);
    }
  }

  // Find paths unique to job2
  for (const path of paths2.paths) {
    const pathStr = path.join(" -> ");
    if (!pathStrings1.has(pathStr)) {
      pathDiffs.onlyInJob2.push(path);
    }
  }

  // Find groups unique to each job
  for (const group of paths1.groupsLeadingToUser) {
    if (!paths2.groupsLeadingToUser.has(group)) {
      groupDiffs.onlyInJob1.add(group);
    }
  }

  for (const group of paths2.groupsLeadingToUser) {
    if (!paths1.groupsLeadingToUser.has(group)) {
      groupDiffs.onlyInJob2.add(group);
    }
  }

  return { pathDiffs, groupDiffs };
}

function printComparisonResults(
  jobId1: string,
  jobId2: string,
  results: ComparisonResult
): void {
  console.log("\n========= User Attribute Differences =========");
  if (
    Object.keys(results.userAttributeDiffs.job1).length === 0 &&
    Object.keys(results.userAttributeDiffs.job2).length === 0
  ) {
    console.log("No differences in user attributes found.");
  } else {
    console.log(`\nAttributes in job ${jobId1} that differ:`);
    for (const [key, value] of Object.entries(
      results.userAttributeDiffs.job1
    )) {
      console.log(`  ${key}: ${value}`);
    }

    console.log(`\nAttributes in job ${jobId2} that differ:`);
    for (const [key, value] of Object.entries(
      results.userAttributeDiffs.job2
    )) {
      console.log(`  ${key}: ${value}`);
    }
  }

  console.log("\n========= Path Differences =========");
  if (
    results.pathDiffs.onlyInJob1.length === 0 &&
    results.pathDiffs.onlyInJob2.length === 0
  ) {
    console.log("No differences in paths found.");
  } else {
    if (results.pathDiffs.onlyInJob1.length > 0) {
      console.log(`\nPaths only in job ${jobId1}:`);
      results.pathDiffs.onlyInJob1
        .map((path) => path.join(" -> "))
        .sort()
        .forEach((path) => console.log(`  ${path}`));
    }

    if (results.pathDiffs.onlyInJob2.length > 0) {
      console.log(`\nPaths only in job ${jobId2}:`);
      results.pathDiffs.onlyInJob2
        .map((path) => path.join(" -> "))
        .sort()
        .forEach((path) => console.log(`  ${path}`));
    }
  }

  console.log("\n========= Group Differences =========");
  if (
    results.groupDiffs.onlyInJob1.size === 0 &&
    results.groupDiffs.onlyInJob2.size === 0
  ) {
    console.log("No differences in groups found.");
  } else {
    if (results.groupDiffs.onlyInJob1.size > 0) {
      console.log(`\nGroups only in job ${jobId1}:`);
      console.log([...results.groupDiffs.onlyInJob1].sort().join(", "));
    }

    if (results.groupDiffs.onlyInJob2.size > 0) {
      console.log(`\nGroups only in job ${jobId2}:`);
      console.log([...results.groupDiffs.onlyInJob2].sort().join(", "));
    }
  }
}

async function handleComparison(
  flags: Flags & { compareJobId: string }
): Promise<void> {
  console.log("\n========= Comparing LDAP Data =========");
  const fileLines = await getSortedLines(flags);

  // Get user attributes for both jobs
  console.log("\nFetching user attributes...");
  const userResult1 = parseUserLogs(
    { ...flags, jobId: flags.jobId },
    fileLines
  );
  const userResult2 = parseUserLogs(
    { ...flags, jobId: flags.compareJobId },
    fileLines
  );

  // Get group paths for both jobs
  console.log("\nAnalyzing group paths...");
  const groupResult1 = parseGroupLogs(fileLines, flags.jobId);
  const groupResult2 = parseGroupLogs(fileLines, flags.compareJobId);

  const pathResults1 = createPathsToUser(groupResult1, flags.userCN);
  const pathResults2 = createPathsToUser(groupResult2, flags.userCN);

  // Compare results
  const attrDiffs = compareAttributes(userResult1, userResult2);
  const { pathDiffs, groupDiffs } = comparePaths(pathResults1, pathResults2);

  // Print results
  printComparisonResults(flags.jobId, flags.compareJobId, {
    userAttributeDiffs: attrDiffs,
    pathDiffs,
    groupDiffs,
  });
}

export default handleComparison;
