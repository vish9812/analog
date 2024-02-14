import type { JSONLog } from "@al/models/logData";
import normalizer from "@al/services/normalizer";

// prevents TS errors
declare var self: Worker;

enum Work {
  Ask,
  Begin,
  End,
}

interface IAnalogWorker {
  work: Work;
}

interface IReaderRequest extends IAnalogWorker {
  workData?: IWorkData;
}

interface IReaderResponse extends IAnalogWorker {
  filteredLogs?: JSONLog[];
}

interface IWorkData {
  filePath: string;
  minTime: string | undefined;
  maxTime: string | undefined;
}

self.onmessage = async (event: MessageEvent<IReaderRequest>) => {
  if (event.data.work === Work.Begin) {
    const data = event.data.workData!;

    const filteredLogs = await processFile(data);

    const res: IReaderResponse = {
      work: Work.Ask,
      filteredLogs,
    };
    postMessage(res);
  } else if (event.data.work === Work.End) {
    process.exit();
  }
};

const res: IReaderResponse = { work: Work.Ask };
postMessage(res);

async function processFile(data: IWorkData): Promise<JSONLog[]> {
  const logsArr: JSONLog[] = [];
  let linesCount = 0;

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
    logsArr.push(jsonLog);
    linesCount++;
  }

  console.info(`Filter Lines Count: ${linesCount} for File: ${data.filePath} `);

  return logsArr;
}

const readerWorker = {
  Work,
  processFile,
};

export default readerWorker;
export type { IReaderRequest, IReaderResponse };
