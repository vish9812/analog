import { select, confirm, input } from "@inquirer/prompts";
import type { Flags, FileLines } from "./types";
import { getSortedLines } from "./helper";

const patterns = {
  cn: /CN=([^,]+)/,
  lastDoubleQuote: /"([^"]+)"/,
};

interface UserAttribute {
  key: string;
  value: string;
}

export interface SearchConfig {
  responseType?: "login" | "job" | "any";
  jobId?: string;
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
  config: SearchConfig,
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

  const resetFlags = () => {
    gotResponse = false;
    foundUser = false;
    reachedTop = false;
    attributeName = undefined;
  };

  for (const fileLine of fileLines) {
    for (let i = 0; i < fileLine.lines.length; i++) {
      let line = fileLine.lines[i].trim();
      if (!line) continue;

      // Check if line matches response block type
      if (
        (config.responseType === "login" &&
          line.includes(loginResponseIdentifier)) ||
        (config.responseType === "job" &&
          line.includes(jobResponseIdentifier)) ||
        (config.responseType === "any" &&
          (line.includes(loginResponseIdentifier) ||
            line.includes(jobResponseIdentifier)))
      ) {
        resetFlags();
        gotResponse = true;
        continue;
      }

      if (!gotResponse) continue;

      if (config.userCN) {
        // Object Name: (Universal, Primitive, Octet String) Len=82 "CN=Tony Stark,OU=Avengers,DC=Marvel,DC=com"
        if (line.startsWith("Object Name:")) {
          const cnMatch = line.match(patterns.cn);
          if (cnMatch && cnMatch[1]) {
            // If the CN does not match, skip the whole response block
            if (!(cnMatch[1] === config.userCN)) {
              resetFlags();
              continue;
            }

            foundUser = true;

            result = {
              filePath: fileLine.filePath,
              lineNumber: i + 1,
              attributes: {},
            };
          }
          continue;
        }
      }

      if (foundUser && !reachedTop) {
        // go to the top till "Object Name:"
        while (!line.startsWith("Object Name:")) {
          i--;
          line = fileLine.lines[i].trim();
        }

        reachedTop = true;
        continue;
      }

      if (reachedTop) {
        // Attribute Name: (Universal, Primitive, Octet String) Len=4 "mail"
        if (line.startsWith("Attribute Name:")) {
          attributeName = line.match(patterns.lastDoubleQuote)?.[1];
          if (attributeName) {
            result!.attributes[attributeName] = "";
          }
          continue;
        }

        if (attributeName) {
          // Attribute Value: (Universal, Primitive, Octet String) Len=23 "tony.stark@marvel.com"
          if (line.startsWith("Attribute Value:")) {
            const attributeValue = line.match(patterns.lastDoubleQuote)?.[1];
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
          return result;
        }
      }
    }
  }

  return result;
}

export default handleUserSearch;
