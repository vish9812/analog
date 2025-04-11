import { readdir } from "node:fs/promises";
import * as path from "node:path";

async function getFilesRecursively(
  folderPath: string,
  prefix: string,
  suffix: string
): Promise<string[]> {
  const fileList: string[] = [];

  async function readDirectory(currentPath: string) {
    const files = await readdir(currentPath, { withFileTypes: true });

    for (const f of files) {
      const filePath = path.join(currentPath, f.name);

      if (f.isDirectory()) {
        // If it's a directory, recursively read its contents
        await readDirectory(filePath);
      } else {
        // If it's a file, check prefix and suffix before adding
        if (f.name.startsWith(prefix) && f.name.endsWith(suffix)) {
          fileList.push(filePath);
        }
      }
    }
  }

  await readDirectory(folderPath);

  return fileList;
}

const fileHelper = {
  getFilesRecursively,
};

export default fileHelper;
