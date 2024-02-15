import timesUtils from "./times";

test.each`
  date1                             | date2                              | expected
  ${new Date(2020, 5, 25, 3, 0, 0)} | ${new Date(2020, 5, 25, 3, 20, 0)} | ${20}
  ${new Date(2020, 5, 25, 3, 0, 0)} | ${new Date(2020, 5, 25, 5, 0, 0)}  | ${120}
  ${new Date(2020, 5, 25, 3, 0, 0)} | ${new Date(2020, 5, 25, 2, 45, 0)} | ${15}
`(
  "diff of $date1 and $date2 should be $expected",
  ({ date1, date2, expected }) => {
    expect(timesUtils.diffMinutes(date1, date2)).toBe(expected);
  }
);
