import { createStore } from "solid-js/store";
import timesUtils from "@al/utils/times";

interface Jumps {
  zero: string;
  prev: string[];
  next: string[];
}

const defaultJumps: () => Jumps = () => ({
  zero: "",
  prev: [],
  next: [],
});

const [jumps, setJumps] = createStore<Jumps>(defaultJumps());
const nextEmpty = () => jumps.next.length === 0;
const prevEmpty = () => jumps.prev.length === 0;

function pop(stack: keyof Jumps): string {
  const id = jumps[stack].at(-1)!;
  setJumps(stack, [...jumps[stack].slice(0, -1)]);
  return id;
}

function push(stack: keyof Jumps, id: string) {
  setJumps(stack, [...jumps[stack], id]);
}

function reset() {
  setJumps(defaultJumps());
}

function jump(next: boolean): string {
  if (next) {
    const jumpID = pop("next");
    push("prev", jumpID);
    return jumpID;
  }

  const currID = pop("prev");
  const jumpID = jumps.prev.at(-1) || jumps.zero;
  push("next", currID);
  return jumpID;
}

function validator(): (currTime: Date) => boolean {
  let prevTime: Date;

  return (currTime): boolean => {
    if (!prevTime) {
      prevTime = currTime;
      return true;
    }

    const isValid = timesUtils.diffMinutes(prevTime, currTime) > 13;
    prevTime = currTime;
    return isValid;
  };
}

function adder() {
  return {
    add: (id: string) => {
      if (!jumps.zero) {
        setJumps("zero", id);
        return;
      }

      push("next", id);
    },
    done: () => {
      // "Reverse" converts the queue(nextJumps) to stack to avoid unshift/shift O(n) ops and instead use push/pop O(1) ops.
      setJumps("next", jumps.next.toReversed());
    },
  };
}

const useJumper = {
  jump,
  reset,
  validator,
  adder,
  nextEmpty,
  prevEmpty,
};

export default useJumper;
