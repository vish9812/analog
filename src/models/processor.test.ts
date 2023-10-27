import stringsUtils from "../utils/strings";
import Processor, { type GroupedMsg } from "./processor";

describe("isErrorLog", () => {
  it.each([
    {
      test: "error as level value",
      log: {
        [Processor.logKeys.level]: "error",
      },
      expected: true,
    },
    {
      test: "error key",
      log: {
        [Processor.logKeys.error]: "error key",
      },
      expected: true,
    },
    {
      test: "both error level and key",
      log: {
        [Processor.logKeys.level]: "error",
        [Processor.logKeys.error]: "error key",
      },
      expected: true,
    },
    {
      test: "no error level or key",
      log: {
        [Processor.logKeys.level]: "another level",
      },
      expected: false,
    },
  ])("returns $expected when log has $test ", ({ log, expected }) => {
    expect(Processor.isErrorLog(log)).toBe(expected);
  });
});

describe("init", () => {
  const cutOffLen = Processor["msgCutOffLen"];

  it("init", async () => {
    const log1 = {
      [Processor.logKeys.error]: "some error",
      [Processor.logKeys.msg]: "has errors",
      parentKey1: "k1",
    };
    const log1String = getJSONString(log1);
    const log2 = {
      [Processor.logKeys.level]: "error",
      [Processor.logKeys.msg]: "dbg msg",
      parentKey1: "k1",
    };
    const log2String = getJSONString(log2);
    const log3 = {
      [Processor.logKeys.level]: "info",
      [Processor.logKeys.msg]: "abc ".repeat(cutOffLen) + "group 1",
      parentKey1: {
        childKey1: 11,
        childKey2: 12,
      },
    };
    const log3String = getJSONString(log3);
    const log4 = {
      [Processor.logKeys.level]: "error",
      [Processor.logKeys.msg]: "abc ".repeat(cutOffLen) + "group 1",
      parentKey1: "k1",
    };
    const log4String = getJSONString(log4);
    const log5 = {
      [Processor.logKeys.level]: "info",
      [Processor.logKeys.msg]: "qwe ".repeat(cutOffLen) + "group 2",
    };
    const log5String = getJSONString(log5);
    const log6 = {
      [Processor.logKeys.level]: "info",
      [Processor.logKeys.msg]: "qwe ".repeat(cutOffLen) + "group 2",
    };
    const log6String = getJSONString(log6);

    function getJSONString(obj: any) {
      return JSON.stringify(obj);
    }

    const file = {
      name: "my-file.txt",
      size: "1024",
      text: () =>
        Promise.resolve(
          `
        ${log1String}
        ${log2String}
        "non-json log"
        ${log3String}
  
        ${log4String}
        
        ${log5String}
        ${log6String}
      `
        ),
    };

    const processor = new Processor();
    await processor.init(file as any);

    expect(processor.fileInfo.name, "file name").toEqual(file.name);
    expect(processor.fileInfo.size, "file size").toEqual(file.size);

    const expectedLogs = [
      { ...log1, id: "1", [Processor.logKeys.fullData]: log1String },
      { ...log2, id: "2", [Processor.logKeys.fullData]: log2String },
      { ...log3, id: "3", [Processor.logKeys.fullData]: log3String },
      { ...log4, id: "4", [Processor.logKeys.fullData]: log4String },
      { ...log5, id: "5", [Processor.logKeys.fullData]: log5String },
      { ...log6, id: "6", [Processor.logKeys.fullData]: log6String },
    ];
    expect(processor.logs, "logs").toEqual(expectedLogs);

    function getCutOffMsg(log: any) {
      return stringsUtils
        .cleanText(log[Processor.logKeys.msg])
        .substring(0, cutOffLen)
        .trim();
    }
    const expectedTopLogsMap = new Map<string, GroupedMsg>([
      [
        getCutOffMsg(log1),
        {
          msg: getCutOffMsg(log1),
          logs: [expectedLogs[0]] as any,
          hasErrors: true,
        },
      ],
      [
        getCutOffMsg(log2),
        {
          msg: getCutOffMsg(log2),
          logs: [expectedLogs[1]] as any,
          hasErrors: true,
        },
      ],
      [
        getCutOffMsg(log3),
        {
          msg: getCutOffMsg(log3),
          logs: [expectedLogs[2], expectedLogs[3]] as any,
          hasErrors: true,
        },
      ],
      [
        getCutOffMsg(log5),
        {
          msg: getCutOffMsg(log5),
          logs: [expectedLogs[4], expectedLogs[5]] as any,
          hasErrors: false,
        },
      ],
    ]);
    expect(processor.topLogsMap.size, "topLogsMap.size").toEqual(
      expectedTopLogsMap.size
    );

    for (const [k, v] of expectedTopLogsMap) {
      const topLog = processor.topLogsMap.get(k);
      expect(topLog, "topLog").toBeTruthy();
      expect(topLog?.hasErrors, "topLogsMap.hasErrors").toEqual(v.hasErrors);
      expect(topLog?.logs, "topLogsMap.logs").toEqual(v.logs);
    }

    expect(processor.topLogs, "topLogs").toEqual(
      [...expectedTopLogsMap.values()].sort(Processor.sortComparerFn)
    );

    const expectedKeys = [
      Processor.logKeys.id,
      Processor.logKeys.fullData,
      Processor.logKeys.msg,
      Processor.logKeys.error,
      Processor.logKeys.level,
      "parentKey1.childKey2",
      "parentKey1.childKey1",
      "parentKey1",
    ].sort();
    expect(processor.keys, "keys").toEqual(expectedKeys);
  });
});
