export interface FileLines {
  filePath: string;
  lines: string[];
}

export interface Flags {
  jobId: string;
  compareJobId: string;
  userCN: string;
  inFolderPath: string;
  prefix: string;
  suffix: string;
}

export const defaultFlags: Flags = {
  jobId: "",
  compareJobId: "",
  userCN: "",
  inFolderPath: ".",
  prefix: "ldap",
  suffix: "log",
};
