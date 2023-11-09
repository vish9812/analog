const regex = {
  url: /(https?|ftp):\/\/[^\s/$.?#].[^\s]*/g,
  email: /[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/g,
  hex: /0[xX][0-9a-fA-F]+/g,
  wordGreaterThan20: /\b[\w-]{21,}\b/g,
  nonWordOrNumberOrDuration: /\W|\d\s?m?s?m?/g,
};

function regexMatch(text: string, pattern: string): boolean {
  return new RegExp(pattern, "i").test(text);
}

function cleanText(text: string): string {
  return text
    .replace(regex.url, " ")
    .replace(regex.email, " ")
    .replace(regex.hex, " ")
    .replace(regex.wordGreaterThan20, " ")
    .replace(regex.nonWordOrNumberOrDuration, " ")
    .split(" ")
    .filter((x) => x.trim())
    .join(" ");
}

const stringsUtils = {
  regexMatch,
  cleanText,
};

export default stringsUtils;
