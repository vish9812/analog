import filesUtils from "./files";

test("downloadNewFile should download the file", () => {
  global.URL.createObjectURL = vi.fn();
  global.URL.revokeObjectURL = vi.fn();

  const link = {
    click: vi.fn(),
    href: "",
    download: "",
    style: {},
  };
  const myURL = "my test url";
  vi.spyOn(document, "createElement").mockImplementation(() => link as any);
  vi.spyOn(document.body, "appendChild").mockImplementation(() => ({} as any));
  vi.spyOn(document.body, "removeChild").mockImplementation(() => ({} as any));
  vi.spyOn(URL, "createObjectURL").mockImplementation(() => myURL);

  const lines = ["test line 1", "test line 2", "ok test"];
  const fileName = "test-file.txt";
  filesUtils.downloadNewFile(fileName, lines);

  expect(link.download).toEqual(fileName);
  expect(link.href).toEqual(myURL);
  expect(link.click).toHaveBeenCalledTimes(1);
});
