interface ICmd {
  help(): void;
  run(): Promise<void>;
}

export type { ICmd };
