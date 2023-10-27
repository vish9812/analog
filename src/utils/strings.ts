const regURL = /(https?|ftp):\/\/[^\s/$.?#].[^\s]*/g;
const regWordGreaterThan20 = /\b[\w-]{21,}\b/g;
const regHex = /0[xX][0-9a-fA-F]+/g;
const regNonWordOrNumberOrDuration = /\W|\d\s?m?s?m?/g;

function regexMatch(text: string, pattern: string): boolean {
  return new RegExp(pattern, "i").test(text);
}

function cleanText(text: string): string {
  return text
    .replace(regURL, " ")
    .replace(regWordGreaterThan20, " ")
    .replace(regHex, " ")
    .replace(regNonWordOrNumberOrDuration, " ")
    .split(" ")
    .filter((x) => x.trim())
    .join(" ");
}

const stringsUtils = {
  regexMatch,
  cleanText,
};

export default stringsUtils;
