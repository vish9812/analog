import objectsUtils from "@al/utils/objects";
import stringsUtils from "@al/utils/strings";

type JSONLog = Record<string, string>;
type JSONLogs = JSONLog[];

interface GroupedMsg {
  msg: string;
  logs: JSONLogs;
  hasErrors: boolean;
}

type LineParserType = (logLine: string) => JSONLog | null;

const regex = {
  lineSplit: /\r?\n/,
};

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

  async init(file: File, lineParser: LineParserType) {
    this.initFileInfo(file);

    const keysSet = new Set<string>();
    let count = 0;
    for (const line of await LogData.getLines(file)) {
      const log = this.addLog(line, lineParser);
      if (log == null) {
        continue;
      }

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

  private addLog(line: string, lineParser: LineParserType): JSONLog | null {
    if (!line || !line.trim()) {
      console.info("skipping empty line");
      return null;
    }

    const log = lineParser(line);
    if (log == null) {
      console.warn("non-supported log format.");
      return null;
    }

    log[LogData.logKeys.fullData] = JSON.stringify(log);
    this.logs.push(log);
    return log;
  }

  private static async getLines(file: File): Promise<string[]> {
    return (await file.text()).split(regex.lineSplit);

    // Sample Test JSON Lines
    // return Promise.resolve([
    //   JSON.stringify({
    //     [this.logKeys.level]: "info",
    //     [this.logKeys.msg]: "msg a",
    //     [this.logKeys.timestamp]: "2023-08-22 03:00:00.000 +10:00",
    //   }),
    //   JSON.stringify({
    //     [this.logKeys.level]: "info",
    //     [this.logKeys.msg]: "test b",
    //     [this.logKeys.timestamp]: "2023-08-22 03:05:00.000 +10:00",
    //   }),
    //   JSON.stringify({
    //     [this.logKeys.level]: "info",
    //     [this.logKeys.msg]: "msg c",
    //     [this.logKeys.timestamp]: "2023-08-22 03:10:00.000 +10:00",
    //   }),
    //   JSON.stringify({
    //     [this.logKeys.level]: "info",
    //     [this.logKeys.msg]: "test d",
    //     [this.logKeys.timestamp]: "2023-08-22 03:15:00.000 +10:00",
    //   }),
    //   JSON.stringify({
    //     [this.logKeys.level]: "info",
    //     [this.logKeys.msg]: "msg e",
    //     [this.logKeys.timestamp]: "2023-08-22 03:20:00.000 +10:00",
    //   }),
    //   JSON.stringify({
    //     [this.logKeys.level]: "info",
    //     [this.logKeys.msg]: "test f",
    //     [this.logKeys.timestamp]: "2023-08-22 03:30:00.000 +10:00",
    //   }),
    //   JSON.stringify({
    //     [this.logKeys.level]: "info",
    //     [this.logKeys.msg]: "msg g",
    //     [this.logKeys.timestamp]: "2023-08-22 03:35:00.000 +10:00",
    //   }),
    //   JSON.stringify({
    //     [this.logKeys.level]: "info",
    //     [this.logKeys.msg]: "test h",
    //     [this.logKeys.timestamp]: "2023-08-22 03:50:00.000 +10:00",
    //   }),
    //   JSON.stringify({
    //     [this.logKeys.level]: "info",
    //     [this.logKeys.msg]: "msg i",
    //     [this.logKeys.timestamp]: "2023-08-22 03:55:00.000 +10:00",
    //   }),
    // ]);
  }
}

export default LogData;
export type { JSONLog, JSONLogs, GroupedMsg };
