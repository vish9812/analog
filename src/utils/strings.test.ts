import stringsUtils from "./strings";

test.each`
  text                    | pattern       | expected
  ${"test regex pattern"} | ${"re.*pa"}   | ${true}
  ${"test regex pattern"} | ${"qwe.*qwe"} | ${false}
`(
  "returns $expected when $pattern is found in $text",
  ({ text, pattern, expected }) => {
    expect(stringsUtils.regexMatch(text, pattern)).toBe(expected);
  }
);

test("cleanText", () => {
  const expected =
    "symbols xyz josief long hyphenated words durations timestamps URLs valid string text hex value of numbers CAPs OKAY z a an the long word works";
  const text =
    "symbols xyz:34=== (josief) long hyphenated words lksjdf23sj-qwe-321-asd durations (5.342ms)(5.342s) timestamps 2023-08-10 19:25:41.543 +05:30 URLs http://www.google.com/nested valid string text - hex value of 0xc000e9b6c0 numbers 23423 CAPs OKAY z a an the long word qwertyuiopasdfghjklwewewas works https://www.google.com";

  expect(stringsUtils.cleanText(text), "cleanText").toEqual(expected);
});
