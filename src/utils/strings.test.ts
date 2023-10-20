import stringsUtils from "./strings";

it.each`
  text                    | pattern       | expected
  ${"test regex pattern"} | ${"re.*pa"}   | ${true}
  ${"test regex pattern"} | ${"qwe.*qwe"} | ${false}
`(
  "returns $expected when $pattern is found in $text",
  ({ text, pattern, expected }) => {
    expect(stringsUtils.regexMatch(text, pattern)).toBe(expected);
  }
);
