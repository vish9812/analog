import normalizer from "./normalizer";

const log1PlainStr = `debug [2023-10-16 10:13:16.710 +11:00] Has a url key value with url containing equal symbol       caller="app/plugin_requests.go:43" missing_plugin_id=com.mattermost.apps url="/plugins/com.mattermost.apps/api/v1/bindings?channel_id=o6tqj5yo5igs8p1m9o7nr9a48c&team_id=sty844ch9tbipr4wiu7ezxgdmy&user_agent=webapp" error="plugin not found: com.mattermost.apps"`;

const log1JSON = {
  timestamp: "2023-10-16 10:13:16.710 +11:00",
  level: "debug",
  msg: "Has a url key value with url containing equal symbol",
  caller: "app/plugin_requests.go:43",
  missing_plugin_id: "com.mattermost.apps",
  url: "/plugins/com.mattermost.apps/api/v1/bindings?channel_id=o6tqj5yo5igs8p1m9o7nr9a48c&team_id=sty844ch9tbipr4wiu7ezxgdmy&user_agent=webapp",
  error: "plugin not found: com.mattermost.apps",
};

const log1JSONStr = JSON.stringify(log1JSON);

const log2PlainStr = `info  [2023-11-01 19:04:55.419 -04:00] 2023/11/01 19:04:55 Plain Log with extra invalid newLines like caller is at new line instead of same
caller="io/io.go:428" plugin_id=com.mattermost.custom-attributes source=plugin_stderr`;

const log2JSON = {
  timestamp: "2023-11-01 19:04:55.419 -04:00",
  level: "info",
  msg: "2023/11/01 19:04:55 Plain Log with extra invalid newLines like caller is at new line instead of same",
  caller: "io/io.go:428",
  plugin_id: "com.mattermost.custom-attributes",
  source: "plugin_stderr",
};

const log2JSONStr = JSON.stringify(log2JSON);

describe("normalizer", () => {
  const testCases = [
    {
      name: "json",
      inputLogs: [log1JSONStr, "invalid-format", log2JSONStr],
      expectedLogs: [log1JSON, null, log2JSON],
    },
    {
      name: "plain",
      inputLogs: [log1PlainStr, "invalid-format", log2PlainStr],
      expectedLogs: [log1JSON, log2JSON],
    },
  ];

  test.each(testCases)("init: $name", async ({ inputLogs, expectedLogs }) => {
    const file = {
      text: () => Promise.resolve(inputLogs.join("\n")),
    };

    let logsCounter = 0;
    const logData = {
      init: (_: any, iterator: any) => {
        for (const log of iterator()) {
          expect(log, logsCounter.toString()).toEqual(
            expectedLogs[logsCounter++]
          );
        }
      },
    };

    await normalizer.init(logData as any, file as any);

    expect(logsCounter, "counter").toEqual(expectedLogs.length);
  });
});
