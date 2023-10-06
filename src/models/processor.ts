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

  static readonly sortComparerFn = (a: GroupedMsg, b: GroupedMsg) =>
    b.count - a.count;
  private static readonly msgCutOffLen = 25;
  static readonly logKeys = {
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

    for (const line of await Processor.getLines(file)) {
      const log = this.addLog(line);
      if (log == null) {
        continue;
      }

      this.initTopLogsMap(log);
    }

    this.topLogs = [...this.topLogsMap.values()].sort(Processor.sortComparerFn);

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
