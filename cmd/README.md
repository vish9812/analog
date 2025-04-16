# Analog CLI

Run analog as cli for analyzing multiple log files.

## Installation

The CLI comes with the Analog app downloaded from the [Releases Page](https://github.com/vish9812/analog/releases).

## Commands:

- **LDAP**: Parses LDAP log files to find all group membership paths for a specific user and job ID, or search for users based on various criteria.
- **Merger**: Merges all files from a given folder within a time range and generate a single time-sorted log file with unique log entries.
- **Summary**: Provides a summary view of all the log files.
- **Web**: Starts a web server to serve the Analog UI.

## Usage:

Execute `./analog --help` to see all available commands.

For specific commands:

- `./analog --help --ldap` - For LDAP command help
- `./analog --help --merger` - For merger command help
- `./analog --help --summary` - For summary command help
- `./analog --help --web` - For web UI command help
