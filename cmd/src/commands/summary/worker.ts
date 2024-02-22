import { parentPort } from "node:worker_threads";
import LogData, { type JSONLog } from "@al/ui/models/logData";
import normalizer from "@al/ui/services/normalizer";

interface IGroupedMsg {
  msg: string;
  logsCount: number;
  hasErrors: boolean;
  firstTime: string;
  lastTime: string;
}

interface ISummaryMapGeneric<TGroupedMsg> {
  msgs: Map<string, TGroupedMsg>;
  httpCodes: Map<string, TGroupedMsg>;
  jobs: Map<string, TGroupedMsg>;
  plugins: Map<string, TGroupedMsg>;
}

type ISummaryMap = ISummaryMapGeneric<IGroupedMsg>;

interface ITask {
  filePath: string;
}

interface IResult {
  filePath: string;
  minTime: string;
  maxTime: string;
  size: number;
  dataMap: ISummaryMap;
}

// Thread Code
if (parentPort) {
  parentPort.on("message", async (task: ITask) => {
    const stats = await processFile(task);
    parentPort!.postMessage(stats);
    console.log(`Processed File: ${stats.filePath}`);
  });
}

async function processFile(task: ITask): Promise<IResult> {
  const stats: IResult = {
    filePath: "",
    maxTime: "0",
    minTime: "z",
    size: 0,
    dataMap: {
      httpCodes: new Map<string, IGroupedMsg>(),
      jobs: new Map<string, IGroupedMsg>(),
      msgs: new Map<string, IGroupedMsg>(),
      plugins: new Map<string, IGroupedMsg>(),
    },
  };

  const logFile = Bun.file(task.filePath);
  stats.size = logFile.size;
  // Keep only the last folder from the filePath
  stats.filePath = task.filePath.split("/").slice(-2).join("/");

  const text = await logFile.text();

  const logsGeneratorFn = normalizer.parse(
    text,
    normalizer.getParserOptions(text),
    () => false
  );

  for (const jsonLog of logsGeneratorFn()) {
    if (!jsonLog) continue;

    const time = jsonLog[LogData.logKeys.timestamp];

    if (time < stats.minTime) {
      stats.minTime = time;
    }

    if (time > stats.maxTime) {
      stats.maxTime = time;
    }

    initSummaryMap(jsonLog, stats.dataMap);
  }

  return stats;
}

function initSummaryMap(log: JSONLog, summaryMap: ISummaryMap) {
  populateSummaryMap(log, summaryMap.msgs, LogData.msgKeySelector);
  populateSummaryMap(log, summaryMap.jobs, LogData.jobKeySelector);
  populateSummaryMap(log, summaryMap.httpCodes, LogData.httpCodeKeySelector);
  populateSummaryMap(log, summaryMap.plugins, LogData.pluginKeySelector);
}

function populateSummaryMap(
  log: JSONLog,
  grpLogsMap: Map<string, IGroupedMsg>,
  keySelectorFn: (log: JSONLog) => string | undefined
) {
  const key = keySelectorFn(log);
  if (!key) return;

  const time = log[LogData.logKeys.timestamp];

  if (!grpLogsMap.has(key)) {
    grpLogsMap.set(key, {
      msg: key,
      hasErrors: false,
      logsCount: 0,
      firstTime: time,
      lastTime: time,
    });
  }

  const grpLog = grpLogsMap.get(key)!;
  grpLog.logsCount++;
  grpLog.hasErrors ||= LogData.isErrorLog(log);

  if (time < grpLog.firstTime) {
    grpLog.firstTime = time;
  }

  if (time > grpLog.lastTime) {
    grpLog.lastTime = time;
  }
}

export type { ITask, IResult, IGroupedMsg, ISummaryMap, ISummaryMapGeneric };
