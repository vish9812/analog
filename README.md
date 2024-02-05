# Analog

Analog is a powerful tool designed for analyzing the log files. It provides several features to help you efficiently work with your log data. Whether you need to identify common patterns, compare logs from different versions, or filter logs based on various criteria, this app has you covered.

## Features

### CLI

Manage _multiple_ log files directly from the command line with the Analog CLI tool.

For details, refer to its [README.md](https://github.com/vish9812/analog/blob/main/src/cmd/README.md) file.

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

- **Logs Context**: Even when a filter is applied, you can access the context around the current log entry.

- **Log File Comparison**:

  - **Compare Two Log Files**: Compare two log files and identify what changed by reviewing newly added or removed log entries.

- **Create and Download a Filtered Subset**: Define filtering criteria to extract a specific subset of logs. You can also compare two subsets of a single log file to track changes.

- **Time Jumps**: Navigate through log data in subsets whenever there is a break of more than 13 minutes.

- **Highlighted JSON Syntax**: Log entries with JSON data are automatically highlighted for improved readability.

- **Highlighted Errors**: Errors in log entries are highlighted, making them stand out for quick identification.

## Prerequisite

- Ensure you have Python 3 [installed](https://www.python.org/downloads/) on your system then you can simply execute the Python server command to run the app.
- Otherwise host the `index.html` manually on any server of your preference.

## Getting Started

Follow these steps to run the app:

1. Download the app from the [Releases Page](https://github.com/vish9812/analog/releases).

2. Unzip the downloaded file to your desired location.

3. Open a terminal and navigate to the app's directory.

4. Execute the following `python` command to start the app:

- For Linux/Mac: `python3 -m http.server 20002`
- For Windows: `python -m http.server 20002`

5. Open your web browser and visit the following URL: `localhost:20002`

You are now ready to use the Analog and take advantage of its powerful log analysis features.

Enjoy analyzing your log data!

## FAQ

### Expected log format

Following are the 3 must have keys in the logs:

- level
- timestamp
- msg

Example Format for JSON logs:

```
{"timestamp":"2023-10-16 10:13:16.710 +11:00","level":"debug","msg":"Received HTTP request","dynamicKey1":"value 1","dynamicKey2":"value 2"}
```

Example Format for plain-text logs:

```
debug [2023-10-16 10:13:16.710 +11:00] Received HTTP request dynamicKey1="value 1" dynamicKey2=value 2
```

## License

This app is released under the [MIT License](https://github.com/vish9812/analog/blob/main/LICENSE).
