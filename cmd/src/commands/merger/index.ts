import { parseArgs } from "util";
import { cpus } from "node:os";
import type { ITask, IResult } from "./worker";
import type { ICmd } from "@al/cmd/utils/cmd-runner";
import type { JSONLog } from "@al/ui/models/logData";
import fileHelper from "@al/cmd/utils/file-helper";
import WorkerPool from "@al/cmd/utils/worker-pool";

let workerURL = new URL("worker.ts", import.meta.url);

const flags = {
  minTime: "0",
  maxTime: "z",
  inFolderPath: ".",
  outFileName: "./merged-logs.log",
  prefix: "mattermost",
  suffix: "log",
};

let filteredLogs: JSONLog[] = [];

function help(): void {
  console.log(`
Merges all files from a given folder within a time range and generates a single time-sorted log file with unique log entries.
The timestamps format must match the format available in the log files.

Caution:  Passing a big time range could lead to keeping millions of log lines in RAM which may lead to slowness.
          Also generating a single big file of more than 300k lines may not be that useful or easy to analyze.
          So, start with small time ranges that you're interested in and then increase the range accordingly.

Usage:

  bun run ./cli/main.js --merger [arguments]

The arguments are:
  
  -x, --minTime           
        Filters out logs with timestamps earlier than the specified minimum time(inclusive).
        Default: minTime of all the logs in the folder.
  
  -y, --maxTime           
        Filters out logs with timestamps equal or later than the specified maximum time(exclusive).
        Default: maxTime of all the logs in the folder.
  
  -i, --inFolderPath      
        Specifies the path to the folder containing the log files. 
        The folder should only contain log files or nested folders with log files.
        Default: . (current directory)
  
  -o, --outFileName
        Specifies the name of the filtered log file to generate. 
        If the file already exists, its content will be overridden.
        Default: ./merged-logs.log

  --prefix
        Specifies the prefix for the log files to include.
        Default: mattermost

  --suffix
        Specifies the suffix for the log files to include.
        Default: log

Example: 
  
  bun run ./cli/main.js -m -x "2024-01-25 19:00:00.000 +00:00" -y "2024-01-25 19:05:00.000 +00:00" -i "/path/to/logs/folder" -o "/path/to/filtered/log/filename.log" --prefix "app-" --suffix "txt"
    `);
}

async function run(): Promise<void> {
  const workerFile = Bun.file(workerURL);
  if (!(await workerFile.exists())) {
    // Path for the compiled executable
    workerURL = new URL("commands/merger/worker.js", import.meta.url);
  }

  parseFlags();

  await processLogs();
}

function parseFlags() {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      filter: {
        type: "boolean",
        short: "m",
      },
      minTime: {
        type: "string",
        short: "x",
        default: flags.minTime,
      },
      maxTime: {
        type: "string",
        short: "y",
        default: flags.maxTime,
      },
      inFolderPath: {
        type: "string",
        short: "i",
        default: flags.inFolderPath,
      },
      outFileName: {
        type: "string",
        short: "o",
        default: flags.outFileName,
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

  flags.inFolderPath = String(values.inFolderPath);
  flags.outFileName = String(values.outFileName);
  flags.minTime = String(values.minTime);
  flags.maxTime = String(values.maxTime);
  flags.prefix = String(values.prefix);
  flags.suffix = String(values.suffix);
}

async function processLogs() {
  const filePaths = await fileHelper.getFilesRecursively(
    flags.inFolderPath,
    flags.prefix,
    flags.suffix
  );

  console.log(
    `Found ${filePaths.length} files matching prefix "${flags.prefix}" and suffix "${flags.suffix}" in "${flags.inFolderPath}"`
  );

  console.log("=========Begin Read Files=========");
  await readFiles(filePaths);
  console.log("=========End Read Files=========");

  sortLogs();
  deDuplicateLogs();

  await writeContent();
}

function readFiles(filePaths: string[]) {
  return new Promise<void>((res, rej) => {
    const maxWorkers = Math.min(
      Math.max(cpus().length - 1, 1),
      filePaths.length
    );

    const pool = new WorkerPool<ITask, IResult>(workerURL, maxWorkers);

    let finishedTasks = 0;
    for (const filePath of filePaths) {
      pool.runTask(
        {
          filePath,
          minTime: flags.minTime,
          maxTime: flags.maxTime,
        },
        async (err, result) => {
          if (err) {
            console.error("Failed for file: ", filePath);
            rej();
          }

          processFileResponse(result);

          if (++finishedTasks === filePaths.length) {
            await pool.close();
            res();
          }
        }
      );
    }
  });
}

function processFileResponse(result: IResult) {
  const fileLogs = result.filteredLogs;
  if (!fileLogs.length) return;

  let idx = filteredLogs.length;

  // Instead of pushing one-by-one, increase length by fixed amount in one-go.
  filteredLogs.length += fileLogs.length;
  fileLogs.forEach((fl) => (filteredLogs[idx++] = fl));
}

function sortLogs() {
  console.log("Sorting Logs");
  filteredLogs.sort((a, b) =>
    a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0
  );
}

/**
 * deDuplicateLogs removes the duplicate logs
 */
function deDuplicateLogs() {
  console.log("De-Duplicating Logs");

  const uniqueLogs: JSONLog[] = [];
  let prevLog: JSONLog | undefined;
  for (const log of filteredLogs) {
    if (!prevLog || prevLog.timestamp !== log.timestamp) {
      uniqueLogs.push(log);
    } else if (prevLog.timestamp === log.timestamp) {
      const prevLogStr = JSON.stringify(prevLog);
      const logStr = JSON.stringify(log);
      if (prevLogStr !== logStr) {
        uniqueLogs.push(log);
      }
    }
    prevLog = log;
  }

  console.log("Removed Duplicates: ", filteredLogs.length - uniqueLogs.length);
  filteredLogs = uniqueLogs;
}

async function writeContent() {
  console.log("Total Logs matched: ", filteredLogs.length);
  console.log("Joining Logs");
  const allContent = filteredLogs.map((l) => JSON.stringify(l)).join("\r\n");
  console.log("Writing Logs");
  await Bun.write(flags.outFileName, allContent);
}

const merger: ICmd = {
  help,
  run,
};

export default merger;
