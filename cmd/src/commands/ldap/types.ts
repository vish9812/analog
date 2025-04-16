export interface FileLines {
  filePath: string;
  lines: string[];
}

export interface Flags {
  jobId: string;
  compareJobId: string;
  userCN: string;
  path: string;
  prefix: string;
  suffix: string;
}

export const defaultFlags: Flags = {
  jobId: "",
  compareJobId: "",
  userCN: "",
  path: ".",
  prefix: "ldap",
  suffix: "log",
};
