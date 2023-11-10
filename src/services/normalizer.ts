import LogData, { JSONLog } from "@al/models/logData";
import objectsUtils from "@al/utils/objects";

// Sample Log Line:
// info [2023-10-16 02:24:52.930 +11:00] Received HTTP request caller="jobs/base_workers.go:97" worker=PostPersistentNotifications job_id=a6kay9tcptdymeezjng9i965mh dynamic1=value1 dynamic2=value2

type ParserFunc = (logLine: string) => JSONLog | null;

async function init(logData: LogData, file: File) {
  const isJSON = await isJSONFile(file);
  const text = await getText(file);
  const textSplitRegex = isJSON
    ? /\r?\n/
    : /\r?\n(?=error|warn|info|verbose|debug|trace)/;
  const parserFunc = isJSON ? jsonParser : plainParser;
  logData.init(file, parse(text, textSplitRegex, parserFunc));
}

async function getText(file: File): Promise<string> {
  return await file.text();
}

async function isJSONFile(file: File): Promise<boolean> {
  const firstLine = (await getText(file)).split(/\r?\n/, 1)[0];
  const log = objectsUtils.parseJSON(firstLine);
  return !!log;
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

function parse(text: string, textSplitRegex: RegExp, parserFunc: ParserFunc) {
  return function* (): Generator<JSONLog | null, void, unknown> {
    for (const line of text.split(textSplitRegex)) {
      yield parserFunc(line);
    }
  };
}

const normalizer = {
  init,
};

export default normalizer;
