type JSONLog = Record<string, string>;
type JSONLogs = JSONLog[];

interface GroupedMsg {
  msg: string;
  count: number;
  hasErrors: boolean;
}

class LogsProcessor {
  static instance = new LogsProcessor([]);
  readonly jsons: JSONLogs = [];
  readonly topMsgs: GroupedMsg[] = [];

  constructor(lines: string[]) {
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        json["fullData"] = line;
        this.jsons.push(json);
      } catch (err) {
        console.log("failed to parse as json for line:", line);
        console.log(err);
      }
    }

    this.topMsgs = this.groupByRepeatingMessages();
  }

  static getLines(text: string): string[] {
    return text.split(/\r?\n/).filter((l) => !!l);
  }

  groupByRepeatingMessages(): GroupedMsg[] {
    let counter: Record<
      string,
      {
        count: number;
        hasErrors: boolean;
      }
    > = {};

    counter = this.jsons.reduce((acc, curr) => {
      const key = curr["msg"].substring(0, 25);
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          hasErrors: false,
        };
      }

      acc[key].count = acc[key].count + 1;
      acc[key].hasErrors =
        !acc[key].hasErrors && LogsProcessor.isErrorLog(curr);

      return acc;
    }, counter);

    const sortedMsgs = Object.entries(counter).sort(
      (a, b) => b[1].count - a[1].count
    );
    return sortedMsgs.map(([msg, val]) => ({
      msg,
      count: val.count,
      hasErrors: val.hasErrors,
    }));
  }

  static isErrorLog(jsonLog: JSONLog): boolean {
    return jsonLog["level"] === "error" || jsonLog["error"] != null;
  }

  static regexMatch(text: string, pattern: string) {
    return new RegExp(pattern, "i").test(text);
  }
}

export default LogsProcessor;
export type { JSONLog, JSONLogs, GroupedMsg };
