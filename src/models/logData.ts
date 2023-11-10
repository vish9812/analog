import objectsUtils from "@al/utils/objects";
import stringsUtils from "@al/utils/strings";

type JSONLog = Record<string, string>;
type JSONLogs = JSONLog[];

interface GroupedMsg {
  msg: string;
  logs: JSONLogs;
  hasErrors: boolean;
}

type LogsGenerator = Generator<JSONLog | null, void, unknown>;

class LogData {
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

  init(file: File, iteratorFunc: () => LogsGenerator) {
    this.initFileInfo(file);

    const keysSet = new Set<string>();
    let count = 0;
    for (const log of iteratorFunc()) {
      if (log == null) {
        console.warn("non-supported log format.");
        continue;
      }

      this.addLog(log);
      log[LogData.logKeys.id] = count++ as any;

      this.initTopLogsMap(log);
      LogData.initKeysSet(log, keysSet);
    }

    this.topLogs = [...this.topLogsMap.values()].sort(LogData.sortComparerFn);
    this.keys = [...keysSet].sort();
  }

  static isErrorLog(log: JSONLog): boolean {
    return (
      log[LogData.logKeys.level] === LogData.levels.error ||
      !!log[LogData.logKeys.error]
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
    const msg = log[LogData.logKeys.msg];
    const cleanMsg = stringsUtils
      .cleanText(msg)
      .substring(0, LogData.msgCutOffLen)
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
    if (!topLog.hasErrors && LogData.isErrorLog(log)) {
      topLog.hasErrors = true;
    }
  }

  private addLog(log: JSONLog) {
    log[LogData.logKeys.fullData] = JSON.stringify(log);
    this.logs.push(log);
  }
}

export default LogData;
export type { JSONLog, JSONLogs, GroupedMsg, LogsGenerator };
