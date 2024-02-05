import LogData, { JSONLog, LogsGenerator, Summary } from "./logData";

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
      test: "Error key",
      log: {
        [LogData.logKeys.Error]: "Error key",
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
  const getCutOffMsg = LogData["getCutOffMsg"];

  it("init", () => {
    const log0 = {
      [LogData.logKeys.error]: "some error",
      [LogData.logKeys.msg]: "has errors",
      [LogData.logKeys.status_code]: "404",
      [LogData.logKeys.plugin_id]: "plugin-1",
      parentKey1: "k1",
    } as JSONLog;
    const log0String = getJSONString(log0);
    const log1 = {
      [LogData.logKeys.level]: "error",
      [LogData.logKeys.msg]: "dbg msg",
      [LogData.logKeys.status]: "200",
      [LogData.logKeys.plugin_id]: "plugin-2",
      [LogData.logKeys.worker]: "job-1",
      parentKey1: "k1",
    } as JSONLog;
    const log1String = getJSONString(log1);
    const log2 = {
      [LogData.logKeys.level]: "info",
      [LogData.logKeys.msg]: "abc ".repeat(cutOffLen) + "group 1",
      [LogData.logKeys.scheduler_name]: "job-1",
      parentKey1: {
        childKey1: 11,
        childKey2: 12,
      },
    } as JSONLog;
    const log2String = getJSONString(log2);
    const log3 = {
      [LogData.logKeys.level]: "error",
      [LogData.logKeys.msg]: "abc ".repeat(cutOffLen) + "group 1",
      [LogData.logKeys.status_code]: "404",
      [LogData.logKeys.worker]: "job-2",
      parentKey1: "k1",
    } as JSONLog;
    const log3String = getJSONString(log3);
    const log4 = {
      [LogData.logKeys.level]: "info",
      [LogData.logKeys.msg]: "qwe ".repeat(cutOffLen) + "group 2",
    } as JSONLog;
    const log4String = getJSONString(log4);
    const log5 = {
      [LogData.logKeys.level]: "info",
      [LogData.logKeys.msg]: "qwe ".repeat(cutOffLen) + "group 2",
    } as JSONLog;
    const log5String = getJSONString(log5);

    function getJSONString(obj: any) {
      return JSON.stringify(obj);
    }

    const file = {
      name: "my-file.txt",
      size: "1024",
    };

    function* logsIterator(): LogsGenerator {
      yield log0;
      yield log1;
      yield null;
      yield log2;
      yield null;
      yield log3;
      yield log4;
      yield log5;
    }

    const logData = new LogData();
    logData.initFileInfo(file as any);
    logData.init(logsIterator);

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

    const expectedSummary: Summary = {
      msgs: [
        {
          msg: getCutOffMsg(log0),
          logs: [expectedLogs[0]] as any,
          hasErrors: true,
        },
        {
          msg: getCutOffMsg(log1),
          logs: [expectedLogs[1]] as any,
          hasErrors: true,
        },
        {
          msg: getCutOffMsg(log2),
          logs: [expectedLogs[2], expectedLogs[3]] as any,
          hasErrors: true,
        },
        {
          msg: getCutOffMsg(log4),
          logs: [expectedLogs[4], expectedLogs[5]] as any,
          hasErrors: false,
        },
      ].sort(LogData.sortByLogsFn),
      httpCodes: [
        {
          msg: log0[LogData.logKeys.status_code],
          logs: [expectedLogs[0], expectedLogs[3]] as any,
          hasErrors: true,
        },
        {
          msg: log1[LogData.logKeys.status],
          logs: [expectedLogs[1]] as any,
          hasErrors: true,
        },
      ].sort(LogData.sortByMsgFn),
      jobs: [
        {
          msg: log1[LogData.logKeys.worker],
          logs: [expectedLogs[1], expectedLogs[2]] as any,
          hasErrors: true,
        },
        {
          msg: log3[LogData.logKeys.worker],
          logs: [expectedLogs[3]] as any,
          hasErrors: true,
        },
      ].sort(LogData.sortByLogsFn),
      plugins: [
        {
          msg: log0[LogData.logKeys.plugin_id],
          logs: [expectedLogs[0]] as any,
          hasErrors: true,
        },
        {
          msg: log1[LogData.logKeys.plugin_id],
          logs: [expectedLogs[1]] as any,
          hasErrors: true,
        },
      ].sort(LogData.sortByLogsFn),
    };

    expect(logData.summary.msgs, "summary.msgs").toEqual(expectedSummary.msgs);
    expect(logData.summary.httpCodes, "summary.httpCodes").toEqual(
      expectedSummary.httpCodes
    );
    expect(logData.summary.jobs, "summary.jobs").toEqual(expectedSummary.jobs);
    expect(logData.summary.plugins, "summary.plugins").toEqual(
      expectedSummary.plugins
    );

    const expectedKeys = [
      LogData.logKeys.id,
      LogData.logKeys.fullData,
      LogData.logKeys.msg,
      LogData.logKeys.error,
      LogData.logKeys.level,
      LogData.logKeys.plugin_id,
      LogData.logKeys.scheduler_name,
      LogData.logKeys.worker,
      LogData.logKeys.status_code,
      LogData.logKeys.status,
      "parentKey1.childKey2",
      "parentKey1.childKey1",
      "parentKey1",
    ].sort();
    expect(logData.keys, "keys").toEqual(expectedKeys);
  });
});
