import fileHelper from "@al/cmd/utils/file-helper";
import type { FileLines, Flags } from "./types";

function findFirstTimestamp(lines: string[]): string | null {
  // Regex to match "LDAPTrace [timestamp]" and capture the timestamp part
  // Example: LDAPTrace [2025-03-15 07:28:00.045 +11:00] some message
  const timestampRegex =
    /^(?:LDAPTrace|LDAPDebug)\s+\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3}\s+[+-]\d{2}:\d{2})\]/;
  for (const line of lines) {
    const match = line.match(timestampRegex);
    if (match && match[1]) {
      return match[1]; // Return the captured timestamp string
    }
  }
  return null; // Return null if no matching line is found
}

export async function getSortedLines(flags: Flags): Promise<FileLines[]> {
  const filePaths = await fileHelper.getFilesRecursively(
    flags.inFolderPath,
    flags.prefix,
    flags.suffix
  );

  if (filePaths.length === 0) {
    console.log(
      `No files found matching prefix "${flags.prefix}" and suffix "${flags.suffix}" in "${flags.inFolderPath}". Exiting.`
    );
    process.exit(0);
  }

  console.log(
    `\nFound ${filePaths.length} files matching prefix "${flags.prefix}" and suffix "${flags.suffix}" in "${flags.inFolderPath}"`
  );

  console.log("\n========= Reading Files & Finding Timestamps =========");

  const fileData: {
    filePath: string;
    lines: string[];
    firstTimestamp: string | null;
  }[] = [];
  for (const filePath of filePaths) {
    console.log(`Reading: ${filePath}`);
    try {
      const content = await Bun.file(filePath).text();
      const lines = content.split(/\r?\n/); // Keep escaped regex
      const firstTimestamp = findFirstTimestamp(lines);
      if (firstTimestamp) {
        fileData.push({ filePath, lines, firstTimestamp });
        console.log(`  Found start timestamp: ${firstTimestamp}`);
      } else {
        console.log(
          `  Warning: No 'LDAPTrace [timestamp]' line found in ${filePath}. Skipping file.`
        );
      }
    } catch (err) {
      console.error(`Error reading or processing file ${filePath}:`, err);
    }
  }

  if (fileData.length === 0) {
    console.log("No valid files with timestamps found to process. Exiting.");
    process.exit(0);
  }

  console.log("========= Sorting Files by Timestamp =========");
  fileData.sort((a, b) => a.firstTimestamp!.localeCompare(b.firstTimestamp!));

  const sortedFileData: FileLines[] = [];
  console.log("Sorted file order:");
  fileData.forEach((f) => {
    console.log(`  - ${f.filePath} (${f.firstTimestamp})`);
    sortedFileData.push({
      filePath: f.filePath,
      lines: f.lines,
    });
  });

  console.log("========= Finished Reading & Sorting Files =========");

  return sortedFileData;
}
