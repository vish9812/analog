import type { GroupedMsg } from "./processor";
import Processor from "./processor";

const processors: Processor[] = [];

function addProcessor(processor: Processor) {
  processors.push(processor);
  if (processors.length > 1) {
    compare();
  }
}

const added: GroupedMsg[] = [];
const removed: GroupedMsg[] = [];

function compare() {
  const mapA = processors[0].topLogsMap;
  const mapB = processors[1].topLogsMap;

  // Removed entries from 2nd log file
  for (const [k, v] of mapA) {
    if (!mapB.has(k)) {
      removed.push(v);
    }
  }

  // Added entries in 2nd log file
  for (const [k, v] of mapB) {
    if (!mapA.has(k)) {
      added.push(v);
    }
  }

  added.sort(Processor.sortComparerFn);
  removed.sort(Processor.sortComparerFn);
}

const comparer = {
  addProcessor,
  added,
  removed,
  isOn: () => processors.length > 1,
  first: () => processors[0],
  last: () => processors[processors.length - 1],
};

export default comparer;
