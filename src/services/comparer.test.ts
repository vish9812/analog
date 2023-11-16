import comparer from "./comparer";
import LogData from "../models/logData";

describe("addLogData", () => {
  test("initial state", () => {
    expect(comparer.isOn(), "isOn").toBeFalsy();
    expect(comparer.first(), "first").toBeFalsy();
    expect(comparer.last(), "last").toBeFalsy();
    expect(comparer.added.length, "added len").toEqual(0);
    expect(comparer.removed.length, "removed len").toEqual(0);
  });

  const logData1 = new LogData();
  logData1.summary = {
    msgs: [
      { logs: [], hasErrors: false, msg: "grp1" },
      { logs: [], hasErrors: false, msg: "grp2" },
      { logs: [], hasErrors: false, msg: "grp3" },
    ],
  } as any;

  test("1st logData", () => {
    comparer.addLogData(logData1);

    expect(comparer.isOn(), "isOn").toBeFalsy();
    expect(comparer.first(), "first").toEqual(logData1);
    expect(comparer.last(), "last").toEqual(logData1);
    expect(comparer.added.length, "added len").toEqual(0);
    expect(comparer.removed.length, "removed len").toEqual(0);
  });

  const logData2 = new LogData();
  logData2.summary = {
    msgs: [
      { logs: [], hasErrors: false, msg: "grp11" },
      logData1.summary.msgs[1],
      { logs: [], hasErrors: false, msg: "grp44" },
      logData1.summary.msgs[2],
    ],
  } as any;

  test("2nd logData", () => {
    comparer.addLogData(logData2);

    expect(comparer.isOn(), "isOn").toBeTruthy();
    expect(comparer.first(), "first").toEqual(logData1);
    expect(comparer.last(), "last").toEqual(logData2);

    const added = [logData2.summary.msgs[0], logData2.summary.msgs[2]];
    const removed = [logData1.summary.msgs[0]];
    expect(comparer.added, "added").toEqual(added);
    expect(comparer.removed, "removed").toEqual(removed);
  });
});
