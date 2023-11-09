import LogData, { JSONLog } from "@al/models/logData";
import objectsUtils from "@al/utils/objects";

// Sample Log Line:
// info [2023-10-16 02:24:52.930 +11:00] Received HTTP request caller="jobs/base_workers.go:97" worker=PostPersistentNotifications job_id=a6kay9tcptdymeezjng9i965mh dynamic1=value1 dynamic2=value2

async function init(logData: LogData, file: File) {
  await logData.init(file, parse);
}

function parse(logLine: string): JSONLog | null {
  const log = objectsUtils.parseJSON<JSONLog>(logLine);
  if (log) {
    return log;
  }

  const regex = {
    // Data before the 1st key=value pair
    text: /(\w+) \[([\d-: .+]+)\] (.*?)(?=(\s\w+=|$))/g,
    // Key=value pairs
    keyVal: /(\w+="[^"]+"|\w+=[^\s]*)/g,
    // Key=Value split pattern
    keyValSplit: /=(.*)/g,
  };

  logLine = logLine
    .split(" ")
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

const normalizer = {
  init,
};

export default normalizer;
