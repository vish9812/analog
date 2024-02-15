import { parentPort } from "node:worker_threads";
import LogData, { type GroupedMsg, type SummaryMap } from "@al/models/logData";
import normalizer from "@al/services/normalizer";

interface ITask {
  filePath: string;
}

interface IResult {
  filePath: string;
  minTime: string;
  maxTime: string;
  size: number;
  dataMap: SummaryMap;
}

// Thread Code
if (parentPort) {
  parentPort.on("message", async (task: ITask) => {
    const stats = await processFile(task);
    parentPort!.postMessage(stats);
    console.log(`Processed File: ${task.filePath}`);
  });
}

async function processFile(task: ITask): Promise<IResult> {
  const stats: IResult = {
    filePath: task.filePath,
    maxTime: "0",
    minTime: "z",
    size: 0,
    dataMap: {
      httpCodes: new Map<string, GroupedMsg>(),
      jobs: new Map<string, GroupedMsg>(),
      msgs: new Map<string, GroupedMsg>(),
      plugins: new Map<string, GroupedMsg>(),
    },
  };

  const logFile = Bun.file(task.filePath);
  stats.size = logFile.size;

  const text = await logFile.text();

  const logsGeneratorFn = normalizer.parse(
    text,
    normalizer.getParserOptions(text),
    () => false
  );

  for (const jsonLog of logsGeneratorFn()) {
    if (!jsonLog) continue;

    if (jsonLog[LogData.logKeys.timestamp] > stats.maxTime) {
      stats.maxTime = jsonLog[LogData.logKeys.timestamp];
    }

    if (jsonLog[LogData.logKeys.timestamp] < stats.minTime) {
      stats.minTime = jsonLog[LogData.logKeys.timestamp];
    }

    LogData.initSummaryMap(jsonLog, stats.dataMap, false);
  }

  return stats;
}

export type { ITask, IResult };
