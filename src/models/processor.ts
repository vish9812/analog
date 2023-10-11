import objectsUtils from "../utils/objects";

type JSONLog = Record<string, string>;
type JSONLogs = JSONLog[];

interface GroupedMsg {
  msg: string;
  count: number;
  hasErrors: boolean;
}

class Processor {
  fileInfo = {
    name: "",
    size: 0,
  };

  logs: JSONLogs = [];
  topLogs: GroupedMsg[] = [];
  topLogsMap = new Map<string, GroupedMsg>();
  keys: string[] = [];

  static readonly sortComparerFn = (a: GroupedMsg, b: GroupedMsg) =>
    b.count - a.count;

  private static readonly msgCutOffLen = 25;
  static readonly logKeys = {
    id: "id",
    fullData: "fullData",
    timestamp: "timestamp",
    msg: "msg",
    level: "level",
    error: "error",
  };
  private static readonly levels = {
    error: "error",
  };

  async init(file: File) {
    this.initFileInfo(file);

    const keysSet = new Set<string>();
    let count = 1;
    for (const line of await Processor.getLines(file)) {
      const log = this.addLog(line);
      if (log == null) {
        continue;
      }

      log[Processor.logKeys.id] = (count++).toString();

      this.initTopLogsMap(log);
      Processor.initKeysSet(log, keysSet);
    }

    this.topLogs = [...this.topLogsMap.values()].sort(Processor.sortComparerFn);
    this.keys = [...keysSet].sort();

    return this;
  }

  static isErrorLog(log: JSONLog): boolean {
    return (
      log[Processor.logKeys.level] === Processor.levels.error ||
      !!log[Processor.logKeys.error]
    );
  }

  private initFileInfo(file: File) {
    this.fileInfo = {
      name: file.name,
      size: file.size,
    };
  }

  private static initKeysSet(log: JSONLog, keysSet: Set<string>) {
    objectsUtils.getNestedKeys(log).forEach((k) => keysSet.add(k));
  }

  private initTopLogsMap(log: JSONLog) {
    const cutOffMsg = log[Processor.logKeys.msg].substring(
      0,
      Processor.msgCutOffLen
    );

    if (!this.topLogsMap.has(cutOffMsg)) {
      this.topLogsMap.set(cutOffMsg, {
        count: 0,
        hasErrors: false,
        msg: cutOffMsg,
      });
    }

    const topLog = this.topLogsMap.get(cutOffMsg)!;
    topLog.count++;
    if (!topLog.hasErrors && Processor.isErrorLog(log)) {
      topLog.hasErrors = true;
    }
  }

  private addLog(line: string): JSONLog | null {
    try {
      const log = JSON.parse(line) as JSONLog;
      log[Processor.logKeys.fullData] = line;
      this.logs.push(log);
      return log;
    } catch (err) {
      console.log("failed to parse the json line:", line);
      console.log(err);
      return null;
    }
  }

  private static async getLines(file: File): Promise<string[]> {
    return (await file.text()).split(/\r?\n/).filter((l) => !!l);
  }
}

export default Processor;
export type { JSONLog, JSONLogs, GroupedMsg };
