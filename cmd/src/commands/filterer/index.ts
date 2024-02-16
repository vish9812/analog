import { parseArgs } from "util";
import { cpus } from "node:os";
import type { ITask, IResult } from "./worker";
import type { ICmd } from "@al/cmd/utils/cmd-runner";
import type { JSONLog } from "@al/ui/models/logData";
import fileHelper from "@al/cmd/utils/file-helper";
import WorkerPool from "@al/cmd/utils/worker-pool";

let workerURL = new URL("worker.ts", import.meta.url);

class Filterer implements ICmd {
  private flags = {
    minTime: "0",
    maxTime: "z",
    inFolderPath: "",
    outFileName: "",
  };

  private filteredLogs: JSONLog[] = [];

  help(): void {
    console.log(`
    Filters all files from a given folder within a time range and generates a single time-sorted log file.
    The timestamps format must match the format available in the log files.
    
    Caution:  Passing a big time range could lead to keeping millions of log lines in RAM which may lead to slowness.
              Also generating a single big file of more than 300k lines may not be that useful or easy to analyze.
              So, start with small time ranges that you're interested in and then increase the range accordingly.
    
    Usage:
    
      bun run ./cli/main.js --filter [arguments]
  
    The arguments are:
      
      -x, --minTime           
            Filters out logs with timestamps earlier than the specified minimum time(inclusive).
            Optional: if maxTime has been provided.
      
      -y, --maxTime           
            Filters out logs with timestamps equal or later than the specified maximum time(exclusive).
            Optional: if minTime has been provided.
      
      -i, --inFolderPath      
            Specifies the path to the folder containing the log files. 
            The folder should only contain log files or nested folders with log files.
      
      -o, --outFileName
            Specifies the name of the filtered log file to generate. 
            If the file already exists, its content will be overridden.
  
    Example: 
      
      bun run ./cli/main.js -f -x "2024-01-25 19:00:00.000 +00:00" -y "2024-01-25 19:05:00.000 +00:00" -i "/path/to/logs/folder" -o "/path/to/filtered/log/filename.log"
    `);
  }

  async run(): Promise<void> {
    const workerFile = Bun.file(workerURL);
    if (!(await workerFile.exists())) {
      // Path for the bundled code
      workerURL = new URL("commands/filterer/worker.js", import.meta.url);
    }

    this.parseFlags();

    await this.processLogs();
  }

  private parseFlags() {
    const { values } = parseArgs({
      args: Bun.argv,
      options: {
        filter: {
          type: "boolean",
          short: "f",
        },
        minTime: {
          type: "string",
          short: "x",
          default: "",
        },
        maxTime: {
          type: "string",
          short: "y",
          default: "",
        },
        inFolderPath: {
          type: "string",
          short: "i",
        },
        outFileName: {
          type: "string",
          short: "o",
        },
      },
      strict: true,
      allowPositionals: true,
    });

    if (!values.inFolderPath) throw new Error("Pass input logs folder path.");
    if (!values.outFileName) throw new Error("Pass output logs file name.");
    if (!values.minTime && !values.maxTime) {
      throw new Error(
        "Pass at least one flag for filtering by time: minTime or maxTime."
      );
    }

    this.flags.inFolderPath = values.inFolderPath;
    this.flags.outFileName = values.outFileName;
    if (values.minTime) this.flags.minTime = values.minTime;
    if (values.maxTime) this.flags.maxTime = values.maxTime;
  }

  private async processLogs() {
    const filePaths = await fileHelper.getFilesRecursively(
      this.flags.inFolderPath
    );

    console.log("=========Begin Read Files=========");
    await this.readFiles(filePaths);
    console.log("=========End Read Files=========");

    this.sortLogs();

    await this.writeContent();
  }

  private readFiles(filePaths: string[]) {
    return new Promise<void>((res, rej) => {
      const maxWorkers = Math.min(
        Math.max(cpus().length - 1, 1),
        filePaths.length
      );

      const pool = new WorkerPool<ITask, IResult>(workerURL, maxWorkers);

      let finishedTasks = 0;
      for (const filePath of filePaths) {
        pool.runTask(
          {
            filePath,
            minTime: this.flags.minTime,
            maxTime: this.flags.maxTime,
          },
          async (err, result) => {
            if (err) {
              console.error("Failed for file: ", filePath);
              rej();
            }

            this.processFileResponse(result);

            if (++finishedTasks === filePaths.length) {
              await pool.close();
              res();
            }
          }
        );
      }
    });
  }

  private processFileResponse(result: IResult) {
    const fileLogs = result.filteredLogs;
    if (!fileLogs.length) return;

    let idx = this.filteredLogs.length;

    // Instead of pushing one-by-one, increase length by fixed amount in one-go.
    this.filteredLogs.length += fileLogs.length;
    fileLogs.forEach((fl) => (this.filteredLogs[idx++] = fl));
  }

  private sortLogs() {
    console.log(
      "Starting Sorting... ",
      this.filteredLogs.length.toLocaleString()
    );
    console.time("sort");
    this.filteredLogs.sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0
    );
    console.timeEnd("sort");
    console.log("Finished Sorting.");
  }

  private async writeContent() {
    console.log("Joining Logs");
    const allContent = this.filteredLogs
      .map((l) => JSON.stringify(l))
      .join("\r\n");
    console.log("Writing Logs");
    await Bun.write(this.flags.outFileName, allContent);
  }
}

export default Filterer;
