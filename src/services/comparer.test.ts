import comparer from "./comparer";
import LogData, { GroupedMsg } from "../models/logData";

describe("addLogData", () => {
  test("initial state", () => {
    expect(comparer.isOn(), "isOn").toBeFalsy();
    expect(comparer.first(), "first").toBeFalsy();
    expect(comparer.last(), "last").toBeFalsy();
    expect(comparer.added.length, "added len").toEqual(0);
    expect(comparer.removed.length, "removed len").toEqual(0);
  });

  const logData1 = new LogData();
  logData1.topLogsMap = new Map<string, GroupedMsg>([
    ["grp1", { logs: [], hasErrors: false, msg: "grp1" }],
    ["grp2", { logs: [], hasErrors: false, msg: "grp2" }],
    ["grp3", { logs: [], hasErrors: false, msg: "grp3" }],
  ]);

  test("1st logData", () => {
    comparer.addLogData(logData1);

    expect(comparer.isOn(), "isOn").toBeFalsy();
    expect(comparer.first(), "first").toEqual(logData1);
    expect(comparer.last(), "last").toEqual(logData1);
    expect(comparer.added.length, "added len").toEqual(0);
    expect(comparer.removed.length, "removed len").toEqual(0);
  });

  const logData2 = new LogData();
  logData2.topLogsMap = new Map<string, GroupedMsg>([
    ["grp11", { logs: [], hasErrors: false, msg: "grp11" }],
    ["grp2", logData1.topLogsMap.get("grp2")!],
    ["grp44", { logs: [], hasErrors: false, msg: "grp44" }],
    ["grp3", logData1.topLogsMap.get("grp3")!],
  ]);

  test("2nd logData", () => {
    comparer.addLogData(logData2);

    expect(comparer.isOn(), "isOn").toBeTruthy();
    expect(comparer.first(), "first").toEqual(logData1);
    expect(comparer.last(), "last").toEqual(logData2);

    const added = [
      logData2.topLogsMap.get("grp11"),
      logData2.topLogsMap.get("grp44"),
    ];
    const removed = [logData1.topLogsMap.get("grp1")];
    expect(comparer.added, "added").toEqual(added);
    expect(comparer.removed, "removed").toEqual(removed);
  });
});
