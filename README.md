# Analog

Analog is a powerful tool designed for analyzing and visualizing log files. It provides several features to help you efficiently work with your log data. Whether you need to identify common patterns, compare logs from different versions of your application, or filter logs based on various criteria, this app has you covered.

## Features

- **Top Logs**: Quickly identify and analyze the most frequently occurring log entries.

- **Filter Logs**:

  - **Filter by Timestamp**: Specify a start and end timestamp to narrow down your log analysis.
  - **Regex Search**: Perform regular expression searches to find specific log entries.
  - **Search Combinations**: Perform normal searches with advanced combination of `Contains/Not Contains` and `AND/OR` operators.
  - **Top Logs**: Select entries in the Top Logs to view all the related logs together.
  - **Errors Only**: Isolate and focus on error log entries.

- **Logs Context**: Even when a filter is applied, you can access the context around the current log entry.

- **Log File Comparison**:

  - **Compare Two Log Files**: Compare two log files and see newly added or removed log entries.

- **Create and Download a Filtered Subset**: Define filtering criteria to extract a specific subset of logs. You can also compare two subsets of a single log file to track changes.

- **Time Jumps**: Navigate through log data in subsets repeating after every few minutes.

- **Highlighted JSON Syntax**: Log entries with JSON data are automatically highlighted for improved readability.

- **Highlighted Errors**: Errors in log entries are highlighted, making them stand out for quick identification.

## Prerequisite

- Ensure you have Python 3 installed on your system then you can simply execute the `analog script` to run the app.
- Otherwise run the `index.html` manually on any server of your preference.

## Getting Started

Follow these steps to run the app:

1. Download the app from the [Releases Page](https://github.com/vish9812/analog/releases).

2. Unzip the downloaded file to your desired location.

3. Open a terminal and navigate to the app's directory.

4. Execute the `analog script` to start the app.

- For Non-Windows, just execute the script `./analog.sh`.
- For Windows, use powershell:
  - _Unblock_(one-time operation) the powershell file `analog.ps1` to be allowed to execute on the system: `Unblock-File .\analog.ps1`
  - Execute the script `.\analog.ps1`

5. Open your web browser and visit the following URL: `localhost:20002`

You are now ready to use the Analog and take advantage of its powerful log analysis features.

Enjoy analyzing your log data!

## License

This app is released under the [MIT License](https://github.com/vish9812/analog/blob/main/LICENSE).
