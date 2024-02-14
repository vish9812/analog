import { readdir } from "node:fs/promises";
import * as path from "node:path";
import { parseArgs } from "util";
import { cpus } from "node:os";
import type { JSONLog } from "@al/models/logData";
import type { ICmd } from "@al/cmd/common";
import readerWorker, {
  type IReaderRequest,
  type IReaderResponse,
} from "./reader.worker";

class Filterer implements ICmd {
  private minTime: string | undefined;
  private maxTime: string | undefined;
  private inFolderPath: string = "";
  private outFileName: string = "";
  private filteredLogs: JSONLog[] = [];
  private filePaths: string[] = [];
  private workerPromises: Promise<void>[] = [];

  // Warn: Workers are not production ready yet.
  // Experimental Note at the top of the page: https://bun.sh/docs/api/workers
  private readonly workerURL = new URL("reader.worker.ts", import.meta.url)
    .href;

  help(): void {
    console.log(`
    Filters all files from a given folder within a time range and generates a single time-sorted log file.
    The timestamps format must match the format available in the log files.
    
    Usage:
    
      analog --filter(-f) [arguments]
  
    The arguments are:
      
      --minTime(-x)           Filters out logs with timestamps earlier than the specified minimum time(inclusive).
      
      --maxTime(-y)           Filters out logs with timestamps equal or later than the specified maximum time(exclusive).
      
      --inFolderPath(-i)      Specifies the path to the folder containing the log files. 
                              The folder should only contain log files or nested folders with log files.
      
      --outFileName(-o)       Specifies the name of the filtered log file to generate. 
                              If the file already exists, its content will be overridden.
  
    Example: 
      
      analog -f -x "2024-01-25 19:00:00.000 +00:00" -y "2024-01-25 19:05:00.000 +00:00" -i "/path/to/logs/folder" -o "/path/to/filtered/log/filename.log"
    `);
  }

  async run(): Promise<void> {
    this.parseFlags();
    await this.processLogs();
  }

  private parseFlags() {
    const { values: flags } = parseArgs({
      args: Bun.argv,
      options: {
        filter: {
          type: "boolean",
          short: "f",
        },
        minTime: {
          type: "string",
          short: "x",
        },
        maxTime: {
          type: "string",
          short: "y",
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

    if (!flags.inFolderPath) throw new Error("Pass input logs folder path.");
    if (!flags.outFileName) throw new Error("Pass output logs file name.");
    if (!flags.minTime && !flags.maxTime) {
      throw new Error(
        "Pass at least one flag for filtering by time: minTime or maxTime."
      );
    }

    this.inFolderPath = flags.inFolderPath;
    this.outFileName = flags.outFileName;
    this.minTime = flags.minTime;
    this.maxTime = flags.maxTime;
  }

  private async processLogs() {
    this.filePaths = await this.getFilesRecursively();

    await this.readFiles();

    if (this.workerPromises.length) {
      await Promise.all(this.workerPromises);
    }

    this.sortLogs();
    await this.writeContent();
  }

  private async readFiles() {
    let hasWorker = true;
    try {
      new Worker(this.workerURL);
    } catch (err) {
      // Issue: https://github.com/oven-sh/bun/issues/7901
      hasWorker = false;
    }

    console.log("Processing files parallely : ", hasWorker);
    hasWorker ? this.readFilesParallely() : await this.readFilesSerially();
  }

  private processFileResponse(fileLogs?: JSONLog[]) {
    if (!fileLogs?.length) return;

    let idx = this.filteredLogs.length;

    // Instead of pushing one-by-one, increase length by fixed amount in one-go.
    this.filteredLogs.length += fileLogs.length;
    fileLogs.forEach((l) => (this.filteredLogs[idx++] = l));
  }

  // TODO: Need it for the compiled cli only as the cli currently doesn't support Workers
  // Issue: https://github.com/oven-sh/bun/issues/7901
  private async readFilesSerially() {
    for (const filePath of this.filePaths) {
      const fileLogs = await readerWorker.processFile({
        filePath,
        minTime: this.minTime,
        maxTime: this.maxTime,
      });
      this.processFileResponse(fileLogs);
    }
  }

  private readFilesParallely() {
    const maxWorkers = Math.min(
      Math.max(cpus().length - 1, 1),
      this.filePaths.length
    );

    for (let i = 0; i < maxWorkers; i++) {
      const promise = new Promise<void>((res) => {
        const worker = new Worker(this.workerURL);

        worker.addEventListener("close", () => {
          res();
        });

        worker.onmessage = (event: Bun.MessageEvent<IReaderResponse>) => {
          if (event.data.work === readerWorker.Work.Ask) {
            this.processFileResponse(event.data.filteredLogs);

            const filePath = this.filePaths.pop();
            const message: IReaderRequest = filePath
              ? {
                  work: readerWorker.Work.Begin,
                  workData: {
                    filePath,
                    minTime: this.minTime,
                    maxTime: this.maxTime,
                  },
                }
              : { work: readerWorker.Work.End };

            worker.postMessage(message);
          }
        };
      });

      this.workerPromises.push(promise);
    }
  }

  private async getFilesRecursively(): Promise<string[]> {
    const fileList: string[] = [];

    async function readDirectory(currentPath: string) {
      const files = await readdir(currentPath, { withFileTypes: true });

      for (const f of files) {
        const filePath = path.join(currentPath, f.name);

        if (f.isDirectory()) {
          // If it's a directory, recursively read its contents
          await readDirectory(filePath);
        } else {
          // If it's a file, add its path to the list
          fileList.push(filePath);
        }
      }
    }

    await readDirectory(this.inFolderPath);

    return fileList;
  }

  private sortLogs() {
    console.log("Starting Sorting...");
    this.filteredLogs.sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0
    );
    console.log("Finished Sorting.");
  }

  private async writeContent() {
    console.log("Joining Logs");
    const allContent = this.filteredLogs
      .map((l) => JSON.stringify(l))
      .join("\r\n");
    console.log("Writing Logs");
    await Bun.write(this.outFileName, allContent);
  }
}

export default Filterer;
