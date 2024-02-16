import prettyBytes from "pretty-bytes";
import { Table } from "console-table-printer";
import { parseArgs } from "util";
import { cpus } from "node:os";
import type { ICmd } from "@al/cmd/utils/cmd-runner";
import { type ITask, type IResult } from "./worker";
import WorkerPool from "@al/cmd/utils/worker-pool";
import fileHelper from "@al/cmd/utils/file-helper";
import type {
  GroupedMsg,
  Summary as SummaryData,
  SummaryMap,
} from "@al/ui/models/logData";
import LogData from "@al/ui/models/logData";

let workerURL = new URL("worker.ts", import.meta.url);

interface IStats extends Omit<IResult, "filePath"> {
  minTimeFile: string;
  maxTimeFile: string;
}

const stats: IStats = {
  maxTime: "0",
  maxTimeFile: "",
  minTime: "z",
  minTimeFile: "",
  size: 0,
  dataMap: {
    httpCodes: new Map<string, GroupedMsg>(),
    jobs: new Map<string, GroupedMsg>(),
    msgs: new Map<string, GroupedMsg>(),
    plugins: new Map<string, GroupedMsg>(),
  },
};

const flags = {
  inFolderPath: "",
  topLogsCount: 30,
};

function help(): void {
  console.log(`
Summary provides a summary view of all the log files.

Usage:

  bun run ./cli/main.js --summary [arguments]

The arguments are:
  
  -i, --inFolderPath             
        Specifies the path to the folder containing the log files. 
        The folder should only contain log files or nested folders with log files.
  
  -t, --top             
        Specifies the maximum number of top logs you see.
        Default: 30

Example: 
  
  bun run ./cli/main.js -s -i "/path/to/logs/folder"
    `);
}

async function run(): Promise<void> {
  const workerFile = Bun.file(workerURL);
  if (!(await workerFile.exists())) {
    // Path for the bundled code
    workerURL = new URL("commands/summary/worker.js", import.meta.url);
  }

  parseFlags();

  await processLogs();
}

function parseFlags() {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      summary: {
        type: "boolean",
        short: "s",
      },
      inFolderPath: {
        type: "string",
        short: "i",
      },
      top: {
        type: "string",
        short: "t",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  if (!values.inFolderPath) throw new Error("Pass input logs folder path.");

  flags.inFolderPath = values.inFolderPath;
  if (values.top) flags.topLogsCount = +values.top;
}

async function processLogs() {
  const filePaths = await fileHelper.getFilesRecursively(flags.inFolderPath);

  console.log("=========Begin Read Files=========");
  await readFiles(filePaths);
  console.log("=========End Read Files=========");

  const summary = LogData.initSummary(stats.dataMap);

  writeContent(summary);
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
      pool.runTask({ filePath }, async (err, result) => {
        if (err) {
          console.error("Failed for file: " + filePath);
          return rej(err);
        }

        processFileResponse(result);

        if (++finishedTasks === filePaths.length) {
          await pool.close();
          return res();
        }
      });
    }
  });
}

function processFileResponse(fileStats: IResult) {
  if (fileStats.maxTime > stats.maxTime) {
    stats.maxTime = fileStats.maxTime;
    stats.maxTimeFile = fileStats.filePath;
  }

  if (fileStats.minTime < stats.minTime) {
    stats.minTime = fileStats.minTime;
    stats.minTimeFile = fileStats.filePath;
  }

  stats.size += fileStats.size;

  initSummaryMap(fileStats.dataMap);
}

function initSummaryMap(dataMap: SummaryMap) {
  mergeIntoOverallMap(dataMap.httpCodes, stats.dataMap.httpCodes);
  mergeIntoOverallMap(dataMap.jobs, stats.dataMap.jobs);
  mergeIntoOverallMap(dataMap.msgs, stats.dataMap.msgs);
  mergeIntoOverallMap(dataMap.plugins, stats.dataMap.plugins);
}

function mergeIntoOverallMap(
  fileMap: Map<string, GroupedMsg>,
  overallMap: Map<string, GroupedMsg>
) {
  for (const [k, v] of fileMap) {
    if (!overallMap.has(k)) {
      overallMap.set(k, {
        msg: v.msg,
        hasErrors: false,
        logs: [],
        logsCount: 0,
      });
    }

    const grpOverall = overallMap.get(k)!;
    grpOverall.hasErrors = grpOverall.hasErrors || v.hasErrors;
    grpOverall.logsCount += v.logsCount!;
  }
}

function writeContent(summary: SummaryData) {
  console.log();

  stats.size = prettyBytes(stats.size) as any;

  let table = new Table({
    title: "Overall summary of all the logs",
    columns: [
      { name: "minTime" },
      { name: "minTimeFile" },
      { name: "maxTime" },
      { name: "maxTimeFile" },
      { name: "totalUniqueLogs" },
      { name: "size" },
    ],
    disabledColumns: ["dataMap"],
  });
  table.addRow(
    {
      ...stats,
      totalUniqueLogs: summary.msgs.length,
    },
    { color: "green" }
  );
  table.printTable();

  writeGroupedMsgs(summary.msgs, "Top Logs");
  writeGroupedMsgs(summary.httpCodes, "HTTP Codes");
  writeGroupedMsgs(summary.jobs, "Jobs");
  writeGroupedMsgs(summary.plugins, "Plugins");
}

function writeGroupedMsgs(grpMsgs: GroupedMsg[], title: string) {
  console.log();

  const table = new Table({
    columns: [
      { name: "msg", title: title, alignment: "left" },
      { name: "logsCount", title: "Count" },
    ],
    disabledColumns: ["hasErrors", "logs"],
  });

  for (const grp of grpMsgs.slice(0, flags.topLogsCount)) {
    table.addRow(grp, { color: grp.hasErrors ? "red" : "green" });
  }

  table.printTable();
}

const summary: ICmd = {
  help,
  run,
};

export default summary;
