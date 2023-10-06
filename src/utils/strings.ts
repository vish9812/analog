function regexMatch(text: string, pattern: string): boolean {
  return new RegExp(pattern, "i").test(text);
}

const stringsUtils = {
  regexMatch,
};

export default stringsUtils;
