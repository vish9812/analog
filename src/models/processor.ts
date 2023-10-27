import objectsUtils from "../utils/objects";
import stringsUtils from "../utils/strings";

type JSONLog = Record<string, string>;
type JSONLogs = JSONLog[];

interface GroupedMsg {
  msg: string;
  logs: JSONLogs;
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
    b.logs.length - a.logs.length;

  private static readonly msgCutOffLen = 80;
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
      const log = this.addLog(line.trim());
      if (log == null) {
        continue;
      }

      log[Processor.logKeys.id] = (count++).toString();

      this.initTopLogsMap(log);
      Processor.initKeysSet(log, keysSet);
    }

    this.topLogs = [...this.topLogsMap.values()].sort(Processor.sortComparerFn);
    this.keys = [...keysSet].sort();
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
    const msg = log[Processor.logKeys.msg];
    const cleanMsg = stringsUtils
      .cleanText(msg)
      .substring(0, Processor.msgCutOffLen)
      .trim();

    if (!this.topLogsMap.has(cleanMsg)) {
      this.topLogsMap.set(cleanMsg, {
        msg: cleanMsg,
        hasErrors: false,
        logs: [],
      });
    }

    const topLog = this.topLogsMap.get(cleanMsg)!;
    topLog.logs.push(log);
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
    return (await file.text()).split(/\r?\n/);
  }
}

export default Processor;
export type { JSONLog, JSONLogs, GroupedMsg };
