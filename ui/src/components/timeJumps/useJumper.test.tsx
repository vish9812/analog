import { createRoot } from "solid-js";
import useJumper from "./useJumper";

test("validator", () => {
  createRoot((dispose) => {
    const { validator } = useJumper;
    const startTime = new Date("2023-07-14 06:00:00.000 Z");

    const t1 = startTime;
    const t2 = addMinutes(t1, 15);
    const t3 = addMinutes(t2, 5);
    const t4 = addMinutes(t3, 15);

    const isValid = validator();

    // First log will always be valid
    expect(isValid(t1), "isValid t1").toEqual(true);

    // From 2nd onwards difference validate diff from previous
    expect(isValid(t2), "isValid t2").toEqual(true);
    expect(isValid(t3), "isValid t3").toEqual(false);
    expect(isValid(t4), "isValid t4").toEqual(true);

    dispose();
  });

  function addMinutes(date: Date, minutes: number) {
    const d = new Date(date);
    d.setMinutes(date.getMinutes() + minutes);
    return d;
  }
});

test("remaining funcs", () => {
  createRoot((dispose) => {
    const { adder, nextEmpty, prevEmpty, jump, reset } = useJumper;

    const i1 = "10";
    const i2 = "20";
    const i3 = "30";
    const i4 = "40";

    // Start Empty
    expect(nextEmpty(), "nextEmpty 1").toEqual(true);
    expect(prevEmpty(), "prevEmpty 1").toEqual(true);

    // Add Ops
    const { add, done } = adder();

    // Add 1st item
    add(i1);

    // Still Empty as 1st item goes to zeroJump
    expect(nextEmpty(), "nextEmpty 2").toEqual(true);
    expect(prevEmpty(), "prevEmpty 2").toEqual(true);

    // Add 2nd item
    add(i2);

    // Next Not Empty anymore
    expect(nextEmpty(), "nextEmpty 3").toEqual(false);
    // Prev remain empty while adding
    expect(prevEmpty(), "prevEmpty 3").toEqual(true);

    // Add remaining items
    add(i3);
    add(i4);
    done();

    // Next Not Empty
    expect(nextEmpty(), "nextEmpty 4").toEqual(false);
    // Prev remain empty
    expect(prevEmpty(), "prevEmpty 4").toEqual(true);

    // Jump Ops
    expect(jump(true), "next 1").toEqual(i2);
    expect(nextEmpty(), "nextEmpty 5").toEqual(false);
    // After 1st next jump, Prev gets populated
    expect(prevEmpty(), "prevEmpty 5").toEqual(false);

    expect(jump(true), "next 2").toEqual(i3);
    expect(nextEmpty(), "nextEmpty 6").toEqual(false);
    expect(prevEmpty(), "prevEmpty 6").toEqual(false);

    expect(jump(true), "next 3").toEqual(i4);
    // After last next jump, Next becomes empty
    expect(nextEmpty(), "nextEmpty 7").toEqual(true);
    expect(prevEmpty(), "prevEmpty 7").toEqual(false);

    expect(jump(false), "prev 1").toEqual(i3);
    // After 1st prev jump, Next gets populated again
    expect(nextEmpty(), "nextEmpty 8").toEqual(false);
    expect(prevEmpty(), "prevEmpty 8").toEqual(false);

    expect(jump(false), "prev 2").toEqual(i2);
    expect(nextEmpty(), "nextEmpty 9").toEqual(false);
    expect(prevEmpty(), "prevEmpty 9").toEqual(false);

    expect(jump(false), "prev 3").toEqual(i1);
    // After last prev jump, Prev becomes empty
    expect(nextEmpty(), "nextEmpty 10").toEqual(false);
    expect(prevEmpty(), "prevEmpty 10").toEqual(true);

    // Jump next again
    expect(jump(true), "next again 1").toEqual(i2);
    expect(nextEmpty(), "nextEmpty again 1").toEqual(false);
    // After 1st next jump again, Prev gets populated again
    expect(prevEmpty(), "prevEmpty again 1").toEqual(false);

    // Reset
    reset();
    expect(nextEmpty(), "nextEmpty reset").toEqual(true);
    expect(prevEmpty(), "prevEmpty reset").toEqual(true);

    dispose();
  });
});
