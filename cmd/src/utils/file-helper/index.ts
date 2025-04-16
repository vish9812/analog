import { readdir, stat } from "node:fs/promises";
import * as path from "node:path";

async function getFiles(
  targetPath: string,
  prefix: string,
  suffix: string
): Promise<string[]> {
  const stats = await stat(targetPath);

  // If it's a file, return it directly
  if (stats.isFile()) {
    return [targetPath];
  }

  // If it's a directory, search recursively with prefix/suffix filtering
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

  await readDirectory(targetPath);
  return fileList;
}

const fileHelper = {
  getFiles,
};

export default fileHelper;
