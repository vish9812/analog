import timesUtils from "./times";
import { Mock } from "vitest";

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

describe("debounce", () => {
  let mockFn: Mock;
  let debouncedFn: Function;

  beforeEach(() => {
    vi.useFakeTimers();
    mockFn = vi.fn();
    debouncedFn = timesUtils.debounce(mockFn, 20);
  });

  it("should not call function until delay is over", () => {
    debouncedFn();
    expect(mockFn).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(15); // Fast forward time to within the debounce duration
    expect(mockFn).toHaveBeenCalledTimes(0);
  });

  it("should call function after delay has passed", () => {
    debouncedFn();

    vi.advanceTimersByTime(21); // Fast forward time beyond the debounce duration
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
