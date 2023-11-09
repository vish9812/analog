import stringsUtils from "@al/utils/strings";
import LogData, { GroupedMsg } from "./logData";

describe("isErrorLog", () => {
  it.each([
    {
      test: "error as level value",
      log: {
        [LogData.logKeys.level]: "error",
      },
      expected: true,
    },
    {
      test: "error key",
      log: {
        [LogData.logKeys.error]: "error key",
      },
      expected: true,
    },
    {
      test: "both error level and key",
      log: {
        [LogData.logKeys.level]: "error",
        [LogData.logKeys.error]: "error key",
      },
      expected: true,
    },
    {
      test: "no error level or key",
      log: {
        [LogData.logKeys.level]: "another level",
      },
      expected: false,
    },
  ])("returns $expected when log has $test ", ({ log, expected }) => {
    expect(LogData.isErrorLog(log)).toBe(expected);
  });
});

describe("init", () => {
  const cutOffLen = LogData["msgCutOffLen"];

  it("init", async () => {
    const log0 = {
      [LogData.logKeys.error]: "some error",
      [LogData.logKeys.msg]: "has errors",
      parentKey1: "k1",
    };
    const log0String = getJSONString(log0);
    const log1 = {
      [LogData.logKeys.level]: "error",
      [LogData.logKeys.msg]: "dbg msg",
      parentKey1: "k1",
    };
    const log1String = getJSONString(log1);
    const log2 = {
      [LogData.logKeys.level]: "info",
      [LogData.logKeys.msg]: "abc ".repeat(cutOffLen) + "group 1",
      parentKey1: {
        childKey1: 11,
        childKey2: 12,
      },
    };
    const log2String = getJSONString(log2);
    const log3 = {
      [LogData.logKeys.level]: "error",
      [LogData.logKeys.msg]: "abc ".repeat(cutOffLen) + "group 1",
      parentKey1: "k1",
    };
    const log3String = getJSONString(log3);
    const log4 = {
      [LogData.logKeys.level]: "info",
      [LogData.logKeys.msg]: "qwe ".repeat(cutOffLen) + "group 2",
    };
    const log4String = getJSONString(log4);
    const log5 = {
      [LogData.logKeys.level]: "info",
      [LogData.logKeys.msg]: "qwe ".repeat(cutOffLen) + "group 2",
    };
    const log5String = getJSONString(log5);

    function getJSONString(obj: any) {
      return JSON.stringify(obj);
    }

    const file = {
      name: "my-file.txt",
      size: "1024",
      text: () =>
        Promise.resolve(
          `
        ${log0String}
        ${log1String}
        "non-json log"
        ${log2String}
  
        ${log3String}
        
        ${log4String}
        ${log5String}
      `
        ),
    };

    const logData = new LogData();
    await logData.init(file as any);

    expect(logData.fileInfo.name, "file name").toEqual(file.name);
    expect(logData.fileInfo.size, "file size").toEqual(file.size);

    const expectedLogs = [
      { ...log0, id: 0, [LogData.logKeys.fullData]: log0String },
      { ...log1, id: 1, [LogData.logKeys.fullData]: log1String },
      { ...log2, id: 2, [LogData.logKeys.fullData]: log2String },
      { ...log3, id: 3, [LogData.logKeys.fullData]: log3String },
      { ...log4, id: 4, [LogData.logKeys.fullData]: log4String },
      { ...log5, id: 5, [LogData.logKeys.fullData]: log5String },
    ];
    expect(logData.logs, "logs").toEqual(expectedLogs);

    function getCutOffMsg(log: any) {
      return stringsUtils
        .cleanText(log[LogData.logKeys.msg])
        .substring(0, cutOffLen)
        .trim();
    }
    const expectedTopLogsMap = new Map<string, GroupedMsg>([
      [
        getCutOffMsg(log0),
        {
          msg: getCutOffMsg(log0),
          logs: [expectedLogs[0]] as any,
          hasErrors: true,
        },
      ],
      [
        getCutOffMsg(log1),
        {
          msg: getCutOffMsg(log1),
          logs: [expectedLogs[1]] as any,
          hasErrors: true,
        },
      ],
      [
        getCutOffMsg(log2),
        {
          msg: getCutOffMsg(log2),
          logs: [expectedLogs[2], expectedLogs[3]] as any,
          hasErrors: true,
        },
      ],
      [
        getCutOffMsg(log4),
        {
          msg: getCutOffMsg(log4),
          logs: [expectedLogs[4], expectedLogs[5]] as any,
          hasErrors: false,
        },
      ],
    ]);
    expect(logData.topLogsMap.size, "topLogsMap.size").toEqual(
      expectedTopLogsMap.size
    );

    for (const [k, v] of expectedTopLogsMap) {
      const topLog = logData.topLogsMap.get(k);
      expect(topLog, "topLog").toBeTruthy();
      expect(topLog?.hasErrors, "topLogsMap.hasErrors").toEqual(v.hasErrors);
      expect(topLog?.logs, "topLogsMap.logs").toEqual(v.logs);
    }

    expect(logData.topLogs, "topLogs").toEqual(
      [...expectedTopLogsMap.values()].sort(LogData.sortComparerFn)
    );

    const expectedKeys = [
      LogData.logKeys.id,
      LogData.logKeys.fullData,
      LogData.logKeys.msg,
      LogData.logKeys.error,
      LogData.logKeys.level,
      "parentKey1.childKey2",
      "parentKey1.childKey1",
      "parentKey1",
    ].sort();
    expect(logData.keys, "keys").toEqual(expectedKeys);
  });
});
