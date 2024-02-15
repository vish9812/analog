import LogData, { GroupedMsg } from "../models/logData";

const logDatas: LogData[] = [];

function addLogData(logData: LogData) {
  logDatas.push(logData);
  if (logDatas.length > 1) {
    compare();
  }
}

const added: GroupedMsg[] = [];
const removed: GroupedMsg[] = [];

function compare() {
  const mapA = getLogMaps(logDatas[0].summary.msgs);
  const mapB = getLogMaps(logDatas[1].summary.msgs);

  // Removed entries from 2nd log file
  for (const [k, v] of mapA) {
    if (!mapB.has(k)) {
      removed.push(v);
    }
  }

  // Added entries in 2nd log file
  for (const [k, v] of mapB) {
    if (!mapA.has(k)) {
      added.push(v);
    }
  }

  added.sort(LogData.sortByLogsFn);
  removed.sort(LogData.sortByLogsFn);
}

function getLogMaps(grpLogs: GroupedMsg[]): Map<string, GroupedMsg> {
  const map = new Map<string, GroupedMsg>();
  grpLogs.forEach((l) => map.set(l.msg, l));
  return map;
}

const comparer = {
  addLogData,
  added,
  removed,
  isOn: () => logDatas.length > 1,
  first: () => logDatas[0],
  last: () => logDatas[logDatas.length - 1],
};

export default comparer;
