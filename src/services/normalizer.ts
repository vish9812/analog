import LogData, { JSONLog, LogsGenerator } from "@al/models/logData";
import objectsUtils from "@al/utils/objects";

// Sample Log Line Format:
// info [2023-10-16 02:24:52.930 +11:00] Received HTTP request caller="jobs/base_workers.go:97" worker=PostPersistentNotifications job_id=a6kay9tcptdymeezjng9i965mh dynamic1=value1 dynamic2=value2

type ParserFunc = (logLine: string) => JSONLog | null;

async function init(logData: LogData, file: File) {
  const text = await getText(file);
  const isJSON = isJSONLog(text);
  const textSplitRegex = isJSON
    ? /\r?\n/
    : /\r?\n(?=error|warn|info|verbose|debug|trace)/;
  const parserFunc = isJSON ? jsonParser : plainParser;
  logData.init(file, parse(text, textSplitRegex, parserFunc));
}

function parse(text: string, textSplitRegex: RegExp, parserFunc: ParserFunc) {
  return function* (): LogsGenerator {
    for (const line of text.split(textSplitRegex)) {
      yield parserFunc(line);
    }
  };
}

function jsonParser(logLine: string): JSONLog | null {
  return objectsUtils.parseJSON(logLine);
}

function plainParser(logLine: string): JSONLog | null {
  const regex = {
    // Data before the 1st key=value pair
    text: /(\w+) \[([\d-: .+]+)\] (.*?)(?=(\s\w+=|$))/g,
    // Key=value pairs
    keyVal: /(\w+="[^"]+"|\w+=[^\s]*)/g,
    // Key=Value split pattern
    keyValSplit: /=(.*)/g,
  };

  logLine = logLine
    .split(/\s/)
    .filter((l) => l)
    .join(" ");

  const matches = regex.text.exec(logLine);

  if (!matches) {
    console.warn("Failed to parse log line: " + logLine);
    return null;
  }

  const [, level, timestamp, message] = matches;

  // Create the JSONLog object
  const jsonLog = {
    [LogData.logKeys.level]: level,
    [LogData.logKeys.timestamp]: timestamp,
    [LogData.logKeys.msg]: message,
  };

  // Capture the key=value pairs
  const kvStr = logLine.slice(matches[0].length + 1);
  const keyValues = kvStr.match(regex.keyVal);

  if (keyValues) {
    keyValues.forEach((kv) => {
      const [key, value] = kv.split(regex.keyValSplit, 2);
      jsonLog[key] = value.replaceAll('"', "");
    });
  }

  return jsonLog;
}

function getText(file: File): Promise<string> {
  return file.text();
  // Sample Test JSON Lines
  // return Promise.resolve(
  //   [
  //     JSON.stringify({
  //       [LogData.logKeys.level]: "info",
  //       [LogData.logKeys.msg]: "msg a",
  //       [LogData.logKeys.timestamp]: "2023-08-22 03:00:00.000 +10:00",
  //     }),
  //     JSON.stringify({
  //       [LogData.logKeys.level]: "info",
  //       [LogData.logKeys.msg]: "test b",
  //       [LogData.logKeys.timestamp]: "2023-08-22 03:05:00.000 +10:00",
  //     }),
  //     JSON.stringify({
  //       [LogData.logKeys.level]: "info",
  //       [LogData.logKeys.msg]: "msg c",
  //       [LogData.logKeys.timestamp]: "2023-08-22 03:10:00.000 +10:00",
  //     }),
  //     JSON.stringify({
  //       [LogData.logKeys.level]: "info",
  //       [LogData.logKeys.msg]: "test d",
  //       [LogData.logKeys.timestamp]: "2023-08-22 03:15:00.000 +10:00",
  //     }),
  //     JSON.stringify({
  //       [LogData.logKeys.level]: "info",
  //       [LogData.logKeys.msg]: "msg e",
  //       [LogData.logKeys.timestamp]: "2023-08-22 03:20:00.000 +10:00",
  //     }),
  //     JSON.stringify({
  //       [LogData.logKeys.level]: "info",
  //       [LogData.logKeys.msg]: "test f",
  //       [LogData.logKeys.timestamp]: "2023-08-22 03:30:00.000 +10:00",
  //     }),
  //     JSON.stringify({
  //       [LogData.logKeys.level]: "info",
  //       [LogData.logKeys.msg]: "msg g",
  //       [LogData.logKeys.timestamp]: "2023-08-22 03:35:00.000 +10:00",
  //     }),
  //     JSON.stringify({
  //       [LogData.logKeys.level]: "info",
  //       [LogData.logKeys.msg]: "test h",
  //       [LogData.logKeys.timestamp]: "2023-08-22 03:50:00.000 +10:00",
  //     }),
  //     JSON.stringify({
  //       [LogData.logKeys.level]: "info",
  //       [LogData.logKeys.msg]: "msg i",
  //       [LogData.logKeys.timestamp]: "2023-08-22 03:55:00.000 +10:00",
  //     }),
  //   ].join("\n")
  // );
}

function isJSONLog(text: string): boolean {
  const firstLine = text.split(/\r?\n/, 1)[0];
  const log = objectsUtils.parseJSON(firstLine);
  return !!log;
}

const normalizer = {
  init,
};

export default normalizer;
