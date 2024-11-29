import normalizer from "./normalizer";

const log1PlainStr = `debug [2023-10-16 10:13:16.710 +11:00] Has a url key value with url containing equal symbol       caller="app/plugin_requests.go:43" missing_plugin_id=com.plugin.apps url="/plugins/com.plugin.apps/api/v1/bindings?channel_id=o6tqj5yo5igs8p1m9o7nr9a48c&team_id=sty844ch9tbipr4wiu7ezxgdmy&user_agent=webapp" error="plugin not found: com.plugin.apps"`;

const log1JSON = {
  timestamp: "2023-10-16 10:13:16.710 +11:00",
  level: "debug",
  msg: "Has a url key value with url containing equal symbol",
  caller: "app/plugin_requests.go:43",
  missing_plugin_id: "com.plugin.apps",
  url: "/plugins/com.plugin.apps/api/v1/bindings?channel_id=o6tqj5yo5igs8p1m9o7nr9a48c&team_id=sty844ch9tbipr4wiu7ezxgdmy&user_agent=webapp",
  error: "plugin not found: com.plugin.apps",
};

const log1JSONStr = JSON.stringify(log1JSON);

const log2PlainStr = `info  [2023-11-01 19:04:55.419 -04:00] 2023/11/01 19:04:55 Plain Log with extra invalid newLines like caller is at new line instead of same
caller="io/io.go:428" plugin_id=com.plugin.custom-attributes source=plugin_stderr`;

const log2JSON = {
  timestamp: "2023-11-01 19:04:55.419 -04:00",
  level: "info",
  msg: "2023/11/01 19:04:55 Plain Log with extra invalid newLines like caller is at new line instead of same",
  caller: "io/io.go:428",
  plugin_id: "com.plugin.custom-attributes",
  source: "plugin_stderr",
};

const log2JSONStr = JSON.stringify(log2JSON);

const log3PlainStr = `info  [2023-12-01 19:04:55.419 -04:00] 2023/12/01 19:04:55 Plain Log with extra invalid newLines like caller is at new line instead of same
caller="io/io.go:428" plugin_id=com.plugin.custom-attributes source=plugin_stderr`;

const log3JSON = {
  timestamp: "2023-12-01 19:04:55.419 -04:00",
  level: "info",
  msg: "2023/12/01 19:04:55 Plain Log with extra invalid newLines like caller is at new line instead of same",
  caller: "io/io.go:428",
  plugin_id: "com.plugin.custom-attributes",
  source: "plugin_stderr",
};

const log3JSONStr = JSON.stringify(log3JSON);

const log4PlainStr = `debug [2024-10-11 10:15:59.309 +11:00] Ldap sync foreign user                        caller="ldap/ldap_sync_job.go:384" worker_name=EnterpriseLdapSync job_id=6sfg1dimb3yixdqgadi8tdh7ey job_type=ldap_sync job_create_at="Oct 10 23:15:56.770" ldap_user=map[allow_marketing:false auth_data: auth_service:ldap create_at:0 delete_at:0 email:something@example.com email_verified:true id: locale: mfa_active:false notify_props:map[] position:US props:map[] remote_id: roles: timezone:map[] update_at:0 username:someone]`;

const log4JSON = {
  timestamp: "2024-10-11 10:15:59.309 +11:00",
  level: "debug",
  msg: "Ldap sync foreign user",
  caller: "ldap/ldap_sync_job.go:384",
  worker_name: "EnterpriseLdapSync",
  job_id: "6sfg1dimb3yixdqgadi8tdh7ey",
  job_type: "ldap_sync",
  job_create_at: "Oct 10 23:15:56.770",
  ldap_user:
    "map[allow_marketing:false auth_data: auth_service:ldap create_at:0 delete_at:0 email:something@example.com email_verified:true id: locale: mfa_active:false notify_props:map[] position:US props:map[] remote_id: roles: timezone:map[] update_at:0 username:someone]",
};

const log4JSONStr = JSON.stringify(log4JSON);

describe("normalizer", () => {
  const plainLog1JSON = { ...log1JSON };
  plainLog1JSON.error += " " + "invalid-format";

  const testCases = [
    {
      name: "json",
      inputLogs: [
        log1JSONStr,
        "invalid-format",
        log2JSONStr,
        log3JSONStr,
        log4JSONStr,
      ],
      expectedLogs: [log1JSON, null, log2JSON, null, log4JSON],
    },
    {
      // in case of plain logs, invalid formats become the last part of the previous log
      name: "plain",
      inputLogs: [
        log1PlainStr,
        "invalid-format",
        log2PlainStr,
        log3PlainStr,
        log4PlainStr,
      ],
      expectedLogs: [plainLog1JSON, log2JSON, null, log4JSON],
    },
  ];

  test.each(testCases)("init: $name", async ({ inputLogs, expectedLogs }) => {
    const file = {
      text: () => Promise.resolve(inputLogs.join("\n")),
    };

    const filterer = ({ timestamp }: any) =>
      timestamp === "2023-12-01 19:04:55.419 -04:00";

    let logsCounter = 0;
    const logData = {
      init: (iterator: any) => {
        for (const log of iterator()) {
          expect(log, logsCounter.toString()).toEqual(
            expectedLogs[logsCounter++]
          );
        }
      },
    };

    await normalizer.init(logData as any, file as any, filterer);

    expect(logsCounter, "counter").toEqual(expectedLogs.length);
  });
});
