import { select, confirm, input } from "@inquirer/prompts";
import type { Flags, FileLines } from "./types";
import { getSortedLines, regexes } from "./helper";

interface UserAttribute {
  key: string;
  value: string;
}

export interface SearchConfig {
  responseType?: "login" | "job" | "any";
  jobId?: string;
  timeRange?: {
    start: string;
    end: string;
  };
  userCN?: string;
  attributes: UserAttribute[];
}

export interface SearchResult {
  filePath: string;
  lineNumber: number;
  attributes: Record<string, string>;
}

async function handleUserSearch(flags: Flags): Promise<void> {
  let config: SearchConfig;
  try {
    config = await gatherSearchConfig();
  } catch (err) {
    if (err instanceof Error && err.name === "ExitPromptError") {
      console.log("Exiting...");
      return;
    }
    throw err;
  }

  const fileLines: FileLines[] = await getSortedLines(flags);

  console.log("\n========= Searching for User =========");
  const result = parseLogs(config, fileLines);
  printResults(result);
}

export function printResults(result: SearchResult | null) {
  if (result) {
    console.log(
      `\nFound matching user at ${result.filePath}:${result.lineNumber}`
    );
    console.log("\nUser attributes:");
    for (const [key, value] of Object.entries(result.attributes)) {
      console.log(`- ${key}: ${value}`);
    }
  } else {
    console.log("\nNo matching user found.");
  }
}

async function gatherSearchConfig(): Promise<SearchConfig> {
  const config: SearchConfig = {
    attributes: [],
  };

  config.responseType = (await select({
    message: "Choose response block type:",
    choices: [
      {
        value: "job",
        name: "Job block (Got response worker_name=EnterpriseLdapSync)",
      },
      { value: "login", name: "Login block (Got response path=/login)" },
      { value: "any", name: "Any" },
    ],
  })) as "login" | "job" | "any";

  if (config.responseType === "job") {
    const specificJob = await confirm({
      message: "Do you want to search for a specific job ID?",
    });

    if (specificJob) {
      config.jobId = await input({
        message: "Enter the job ID:",
      });
    }
  }

  if (!config.jobId) {
    const byTimeRange = await confirm({
      message:
        "Do you want to search by time range? Time format example: 2025-03-15 06:40:06.310 +11:00",
    });

    if (byTimeRange) {
      config.timeRange = {
        start: await input({
          message: "Enter the start time (inclusive):",
          required: true,
        }),
        end: await input({
          message: "Enter the end time (exclusive):",
          required: true,
        }),
      };
    }
  }

  // Must have either user CN or at least one attribute
  const searchType = (await select({
    message: "Choose search type:",
    choices: [
      { value: "userCN", name: "User CN" },
      { value: "attributes", name: "Attributes" },
    ],
  })) as "userCN" | "attributes";

  if (searchType === "userCN") {
    config.userCN = await input({
      message: "Enter the user CN:",
      required: true,
    });
  } else {
    let addMore = true;
    while (addMore) {
      const key = await input({
        message: "Enter attribute key (e.g., mail, givenName):",
        required: true,
      });

      const value = await input({
        message: `Enter value for ${key}:`,
        required: true,
      });

      config.attributes.push({ key, value });

      addMore = await confirm({
        message: "Do you want to add another attribute?",
      });
    }
  }

  return config;
}

export function parseLogs(
  config: SearchConfig | { jobId: string; userCN: string },
  fileLines: FileLines[]
): SearchResult | null {
  let result: SearchResult | null = null;

  const loginResponseIdentifier = "Got response path=/login";
  let jobResponseIdentifier =
    "Got response worker_name=EnterpriseLdapSync job_id=";

  if (config.jobId) {
    jobResponseIdentifier += config.jobId;
  }

  let gotResponse = false;
  let foundUser = false;
  let reachedTop = false;
  let attributeName: string | undefined;
  let attributeForSearch: UserAttribute | undefined;

  const resetFlags = () => {
    gotResponse = false;
    foundUser = false;
    reachedTop = false;
    attributeName = undefined;
    attributeForSearch = undefined;
  };

  const allLines = fileLines.flatMap((fileLine) => fileLine.lines);

  for (let i = 0; i < allLines.length; i++) {
    let line = allLines[i].trim();
    if (!line) continue;

    // Check if line matches response block type
    if (
      ("responseType" in config &&
        ((config.responseType === "login" &&
          line.includes(loginResponseIdentifier)) ||
          (config.responseType === "job" &&
            line.includes(jobResponseIdentifier)) ||
          (config.responseType === "any" &&
            (line.includes(loginResponseIdentifier) ||
              line.includes(jobResponseIdentifier))))) ||
      (!("responseType" in config) && line.includes(jobResponseIdentifier))
    ) {
      if ("timeRange" in config && config.timeRange && !gotResponse) {
        const timeMatch = line.match(regexes.time);
        if (timeMatch && timeMatch[1]) {
          const responseTime = timeMatch[1];
          if (
            responseTime < config.timeRange.start ||
            responseTime >= config.timeRange.end
          ) {
            continue;
          }
        }
      }

      resetFlags();
      gotResponse = true;
      continue;
    }

    if (!gotResponse) continue;

    if (!foundUser) {
      // Search by user CN
      if (config.userCN) {
        // Object Name: (Universal, Primitive, Octet String) Len=82 "CN=Tony Stark,OU=Avengers,DC=Marvel,DC=com"
        if (line.startsWith("Object Name:")) {
          const cnMatch = line.match(regexes.cn);
          if (cnMatch && cnMatch[1]) {
            // If the CN does not match, skip the whole response block
            if (!(cnMatch[1] === config.userCN)) {
              resetFlags();
              continue;
            }

            foundUser = true;
          }
          continue;
        }
      } else if ("attributes" in config) {
        // Search by user attributes
        if (line.startsWith("Attribute Name:")) {
          const attrKey = line.match(regexes.lastDoubleQuote)?.[1];
          attributeForSearch = config.attributes.find(
            (attr) => attr.key === attrKey
          );
          continue;
        }

        if (attributeForSearch && line.startsWith("Attribute Value:")) {
          const attrVal = line.match(regexes.lastDoubleQuote)?.[1];
          if (attributeForSearch.value === attrVal) {
            foundUser = true;
          }
          continue;
        }
      }
    }

    if (foundUser && !reachedTop) {
      // go to the top till "Object Name:"
      while (!line.startsWith("Object Name:")) {
        i--;
        line = allLines[i].trim();
      }

      result = {
        filePath: "",
        lineNumber: i + 1,
        attributes: {},
      };

      reachedTop = true;
      continue;
    }

    if (reachedTop) {
      // Attribute Name: (Universal, Primitive, Octet String) Len=4 "mail"
      if (line.startsWith("Attribute Name:")) {
        attributeName = line.match(regexes.lastDoubleQuote)?.[1];
        if (attributeName) {
          result!.attributes[attributeName] = "";
        }
        continue;
      }

      if (attributeName) {
        // Attribute Value: (Universal, Primitive, Octet String) Len=23 "tony.stark@marvel.com"
        if (line.startsWith("Attribute Value:")) {
          const attributeValue = line.match(regexes.lastDoubleQuote)?.[1];
          if (attributeValue) {
            result!.attributes[attributeName] = attributeValue;
          }
          attributeName = undefined;
          continue;
        }
      }

      // If not starting with Attribute, then we are no longer in the attributes block
      if (!line.startsWith("Attribute")) {
        // Found first occurrence of the user and collected all attributes
        return identifyFileAndItsLine(fileLines, result);
      }
    }
  }

  return identifyFileAndItsLine(fileLines, result);
}

function identifyFileAndItsLine(
  fileLines: FileLines[],
  searchResult: SearchResult | null
): SearchResult | null {
  if (!searchResult) return null;

  const combinedFilesLineNumber = searchResult.lineNumber;
  let prevMax = 0;
  for (let i = 0; i < fileLines.length; i++) {
    let currMax = prevMax + fileLines[i].lines.length;
    if (combinedFilesLineNumber <= currMax) {
      return {
        ...searchResult,
        filePath: fileLines[i].filePath,
        lineNumber: combinedFilesLineNumber - prevMax,
      };
    }
    prevMax = currMax;
  }
  return searchResult;
}

export default handleUserSearch;
