import type { JSONLog } from "@al/ui/models/logData";
import normalizer from "@al/ui/services/normalizer";
import { parentPort } from "node:worker_threads";

interface ITask {
  filePath: string;
  minTime: string | undefined;
  maxTime: string | undefined;
}

interface IResult {
  filteredLogs: JSONLog[];
}

// Thread Code
if (parentPort) {
  parentPort.on("message", async (task: ITask) => {
    const result = await processFile(task);
    parentPort!.postMessage(result);
  });
}

async function processFile(data: ITask): Promise<IResult> {
  const result: IResult = {
    filteredLogs: [],
  };

  const text = await Bun.file(data.filePath).text();

  const filterer = ({ timestamp }: JSONLog) =>
    !!(
      (data.minTime && timestamp < data.minTime) ||
      (data.maxTime && timestamp >= data.maxTime)
    );

  const logsGeneratorFn = normalizer.parse(
    text,
    normalizer.getParserOptions(text),
    filterer
  );
  for (const jsonLog of logsGeneratorFn()) {
    if (!jsonLog) continue;
    result.filteredLogs.push(jsonLog);
  }

  console.log(
    `${result.filteredLogs.length} lines matched in File: ${data.filePath} `
  );

  return result;
}

export type { ITask, IResult };
