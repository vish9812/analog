import comparer from "./comparer";
import Processor, { type GroupedMsg } from "./processor";

describe("addProcessor", () => {
  test("initial state", () => {
    expect(comparer.isOn(), "isOn").toBeFalsy();
    expect(comparer.first(), "first").toBeFalsy();
    expect(comparer.last(), "last").toBeFalsy();
    expect(comparer.added.length, "added len").toEqual(0);
    expect(comparer.removed.length, "removed len").toEqual(0);
  });

  const processor1 = new Processor();
  processor1.topLogsMap = new Map<string, GroupedMsg>([
    ["grp1", { logs: [], hasErrors: false, msg: "grp1" }],
    ["grp2", { logs: [], hasErrors: false, msg: "grp2" }],
    ["grp3", { logs: [], hasErrors: false, msg: "grp3" }],
  ]);

  test("1st processor", () => {
    comparer.addProcessor(processor1);

    expect(comparer.isOn(), "isOn").toBeFalsy();
    expect(comparer.first(), "first").toEqual(processor1);
    expect(comparer.last(), "last").toEqual(processor1);
    expect(comparer.added.length, "added len").toEqual(0);
    expect(comparer.removed.length, "removed len").toEqual(0);
  });

  const processor2 = new Processor();
  processor2.topLogsMap = new Map<string, GroupedMsg>([
    ["grp11", { logs: [], hasErrors: false, msg: "grp11" }],
    ["grp2", processor1.topLogsMap.get("grp2")!],
    ["grp44", { logs: [], hasErrors: false, msg: "grp44" }],
    ["grp3", processor1.topLogsMap.get("grp3")!],
  ]);

  test("2nd processor", () => {
    comparer.addProcessor(processor2);

    expect(comparer.isOn(), "isOn").toBeTruthy();
    expect(comparer.first(), "first").toEqual(processor1);
    expect(comparer.last(), "last").toEqual(processor2);

    const added = [
      processor2.topLogsMap.get("grp11"),
      processor2.topLogsMap.get("grp44"),
    ];
    const removed = [processor1.topLogsMap.get("grp1")];
    expect(comparer.added, "added").toEqual(added);
    expect(comparer.removed, "removed").toEqual(removed);
  });
});
