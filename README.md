# Analog

Analog is a powerful tool designed for analyzing the log files. It provides several features to help you efficiently work with your log data. Whether you need to identify common patterns, compare logs from different versions, or filter logs based on various criteria, this app has you covered.

## Features

### CLI

Analyze _multiple_ log files directly from the command line with the Analog CLI tool.

For details, refer to its [README.md](https://github.com/vish9812/analog/blob/main/cmd/README.md) file.

### Web UI

- **Summary View**: Quickly gain insights into your log file with the Summary View. It provides frequencies of the following key aspects:

  - Top Logs
  - HTTP Codes
  - Jobs
  - Plugins

- **Filter Logs**:

  - **Filter by Timestamp**: Specify a start and end timestamp to narrow down your log analysis.
  - **Regex Search**: Perform regular expression searches to find specific log entries.
  - **Search Combinations**: Perform normal searches with advanced combination of `Contains/Not Contains` and `AND/OR` operators.
  - **Errors Only**: Isolate and focus on error log entries.
  - **Summary View**: Filter on any of the key aspect of the Summary View.

- **Log File Comparison**:

  - **Compare Two Log Files**: Compare two log files and identify what changed by reviewing newly added or removed log entries.

- **Create and Download a Filtered Subset**: Define filtering criteria to extract a specific subset of logs. You can also compare two subsets of a single log file to track changes.

- **Logs Context**: Even when a filter is applied, you can access the context around the current log entry.

- **Time Jumps**: Navigate through log data in subsets whenever there is a time break of certain minutes. Example: If you have downloaded a subset of a job. Then with time jumps, you can navigate to next or previous runs of that job.

- **Deduplicate Logs**: Remove _similar_ log occurrences leaving only the First N and Last N occurrences to help you easily find the first and last occurrences of those events.

## Prerequisite:

- [Bun](https://bun.sh/docs/installation) is needed to run the CLI.
- [Python 3](https://www.python.org/downloads/) is needed to run the UI.
  - Python will be automatically installed if you run the Analog UI app with the `analog` script.

## Getting Started

Follow these steps to run the app:

1. Download the app from the [Releases Page](https://github.com/vish9812/analog/releases).

2. Unzip the downloaded file to your desired location.

3. Open a terminal and navigate to the app's directory.

4. Execute the following script to start the app:

- The script will download python 3 if not installed.
- For Linux/Mac: `./analog.sh`
- For Windows: `./analog.ps1`

5. Open your web browser and visit the following URL: `localhost:20002`

You are now ready to use the Analog and take advantage of its powerful log analysis features.

Enjoy analyzing your log data!

## Contribution

Refer to the [Contribution](https://github.com/vish9812/analog/blob/main/Contribution.md) file.

## FAQ

### Expected log format

Following are the 3 must have keys in the logs:

- level
- timestamp
- msg

Expected Format for JSON logs:

```
{"timestamp":"2023-10-16 10:13:16.710 +11:00","level":"debug","msg":"Received HTTP request","dynamicKey1":"value 1","dynamicKey2":"value 2"}
```

Expected Format for plain-text logs:

```
debug [2023-10-16 10:13:16.710 +11:00] Received HTTP request dynamicKey1="value 1" dynamicKey2=value 2
```

### Utility Commands

#### Uncompress logs

```bash
find . -name "*.gz" -print0 | xargs -0 -P 0 -I{} sh -c 'gzip -d "`dirname \"{}\"`" "{}"' ';'
```

#### Split into smaller files and Remove original big files

```bash
find . -type f -print0 | xargs -0 -P 0 -I{} sh -c 'split -d -l 250000 "{}" "{}_" && rm "{}"'
```

#### Convert to parsable format

There could be many formats and the following command should be modified according to the formats.

This command:

- converts the format `2024-01-25T19:00:41.108Z debug [2024-01-25 19:00:41.108 Z] Received HTTP request` to `debug [2024-01-25 19:00:41.108 +00:00] Received HTTP request`
- Remove 1st timestamp before the level(debug/info/etc.)
- Replace `Z` in timestamps with `+00:00`

```bash
find . -type f -print0 | xargs -0 -P 0 -L 1 sed -i -e 's/^[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}T[0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}\.[0-9]\{3\}Z //g' -r -e 's/(\[[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3} )Z/\1+00:00/g'
```

## License

This app is released under the [MIT License](https://github.com/vish9812/analog/blob/main/LICENSE).
