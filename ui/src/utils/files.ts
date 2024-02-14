function downloadNewFile(name: string, lines: string[]) {
  const text = lines.filter((l) => l).join("\r\n");
  const blob = new Blob([text], { type: "text/plain", endings: "native" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();

  URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}

const filesUtils = {
  downloadNewFile,
};

export default filesUtils;
