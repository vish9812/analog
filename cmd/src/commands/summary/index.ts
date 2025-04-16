import prettyBytes from "pretty-bytes";
import { Table } from "console-table-printer";
import { parseArgs } from "util";
import { cpus } from "node:os";
import type { ICmd } from "@al/cmd/utils/cmd-runner";
import type {
  ITask,
  IResult,
  IGroupedMsg,
  ISummaryMap,
  ISummaryMapGeneric,
} from "./worker";
import WorkerPool from "@al/cmd/utils/worker-pool";
import fileHelper from "@al/cmd/utils/file-helper";

let workerURL = new URL("worker.ts", import.meta.url);

interface IStats extends Omit<IResult, "filePath" | "dataMap"> {
  minTimeFile: string;
  maxTimeFile: string;
  dataMap: IStatsSummaryMap;
}

interface IStatsGroupedMsg extends IGroupedMsg {
  firstFile: string;
  lastFile: string;
}

type IStatsSummaryMap = ISummaryMapGeneric<IStatsGroupedMsg>;

interface ISummary {
  msgs: IStatsGroupedMsg[];
  httpCodes: IStatsGroupedMsg[];
  jobs: IStatsGroupedMsg[];
  plugins: IStatsGroupedMsg[];
}

const stats: IStats = {
  maxTime: "0",
  maxTimeFile: "",
  minTime: "z",
  minTimeFile: "",
  size: 0,
  dataMap: {
    httpCodes: new Map<string, IStatsGroupedMsg>(),
    jobs: new Map<string, IStatsGroupedMsg>(),
    msgs: new Map<string, IStatsGroupedMsg>(),
    plugins: new Map<string, IStatsGroupedMsg>(),
  },
};

const flags = {
  path: ".",
  topLogsCount: 30,
  prefix: "mattermost",
  suffix: "log",
};

function help(): void {
  console.log(`
Summary provides a summary view of all the log files.

Usage:

  ./analog --summary [arguments]

The arguments are:
  
  -p, --path
        Specifies the path to either a single log file or a folder containing log files.
        If a folder is provided, it traverses all the files in the folder and its subfolders.
        If a file is provided, then prefix and suffix flags are ignored.
        Default: . (current directory)
  
  -t, --top             
        Specifies the maximum number of top logs you see.
        Default: 30

  --prefix
        Specifies the prefix for the log files to include.
        Default: mattermost

  --suffix
        Specifies the suffix for the log files to include.
        Default: log

Example: 
  
  ./analog -s -p "/path/to/logs/folder" --prefix "debug-" --suffix "txt"
    `);
}

async function run(): Promise<void> {
  const workerFile = Bun.file(workerURL);
  if (!(await workerFile.exists())) {
    // Path for the compiled executable
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
      path: {
        type: "string",
        short: "p",
        default: flags.path,
      },
      top: {
        type: "string",
        short: "t",
        default: String(flags.topLogsCount),
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
    strict: true,
    allowPositionals: true,
  });

  flags.path = String(values.path);
  flags.topLogsCount = Number(values.top) || flags.topLogsCount;
  flags.prefix = String(values.prefix);
  flags.suffix = String(values.suffix);
}

async function processLogs() {
  const filePaths = await fileHelper.getFiles(
    flags.path,
    flags.prefix,
    flags.suffix
  );

  console.log(
    `Found ${filePaths.length} files matching prefix "${flags.prefix}" and suffix "${flags.suffix}" in "${flags.path}"`
  );

  console.log("=========Begin Read Files=========");
  await readFiles(filePaths);
  console.log("=========End Read Files=========");

  const summary = initSummary(stats.dataMap);

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

  initSummaryMap(fileStats.dataMap, fileStats.filePath);
}

function initSummaryMap(dataMap: ISummaryMap, filePath: string) {
  mergeIntoOverallMap(dataMap.httpCodes, stats.dataMap.httpCodes, filePath);
  mergeIntoOverallMap(dataMap.jobs, stats.dataMap.jobs, filePath);
  mergeIntoOverallMap(dataMap.msgs, stats.dataMap.msgs, filePath);
  mergeIntoOverallMap(dataMap.plugins, stats.dataMap.plugins, filePath);
}

function mergeIntoOverallMap(
  fileMap: Map<string, IGroupedMsg>,
  overallMap: Map<string, IStatsGroupedMsg>,
  filePath: string
) {
  for (const [k, v] of fileMap) {
    if (!overallMap.has(k)) {
      overallMap.set(k, {
        msg: v.msg,
        hasErrors: false,
        logsCount: 0,
        firstTime: v.firstTime,
        lastTime: v.lastTime,
        firstFile: filePath,
        lastFile: filePath,
      });
    }

    const grpOverall = overallMap.get(k)!;
    grpOverall.hasErrors ||= v.hasErrors;
    grpOverall.logsCount += v.logsCount!;

    if (v.firstTime < grpOverall.firstTime) {
      grpOverall.firstTime = v.firstTime;
      grpOverall.firstFile = filePath;
    }

    if (v.lastTime > grpOverall.lastTime) {
      grpOverall.lastTime = v.lastTime;
      grpOverall.lastFile = filePath;
    }
  }
}

function summarySorterFn(a: IStatsGroupedMsg, b: IStatsGroupedMsg) {
  return b.logsCount - a.logsCount;
}

function initSummary(summaryMap: IStatsSummaryMap): ISummary {
  return {
    msgs: [...summaryMap.msgs.values()].sort(summarySorterFn),
    httpCodes: [...summaryMap.httpCodes.values()].sort(summarySorterFn),
    jobs: [...summaryMap.jobs.values()].sort(summarySorterFn),
    plugins: [...summaryMap.plugins.values()].sort(summarySorterFn),
  };
}

function writeContent(summary: ISummary) {
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

function writeGroupedMsgs(grpMsgs: IStatsGroupedMsg[], title: string) {
  console.log();

  const table = new Table({
    columns: [
      { name: "msg", title: title, alignment: "left" },
      { name: "logsCount", title: "Count" },
    ],
    disabledColumns: ["hasErrors"],
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
