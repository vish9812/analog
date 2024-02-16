import { AsyncResource } from "node:async_hooks";
import { EventEmitter } from "node:events";
import { Worker } from "node:worker_threads";

const kTaskInfo = Symbol("kTaskInfo");
const kWorkerFreedEvent = Symbol("kWorkerFreedEvent");

class TaskInfoWorker<TResult> extends Worker {
  [kTaskInfo]: WorkerPoolTaskInfo<TResult> | null = null;

  constructor(workerURL: URL) {
    super(workerURL);
  }
}

type CallbackFn<TResult> = (err: Error | null, result: TResult) => void;

class WorkerPoolTaskInfo<TResult> extends AsyncResource {
  private callback: CallbackFn<TResult>;

  constructor(callback: CallbackFn<TResult>) {
    super("WorkerPoolTaskInfo");
    this.callback = callback;
  }

  done(err: Error | null, result: TResult) {
    this.runInAsyncScope(this.callback, null, err, result);
    this.emitDestroy(); // `TaskInfo`s are used only once.
  }
}

class WorkerPool<TTask, TResult> extends EventEmitter {
  private workers: TaskInfoWorker<TResult>[] = [];
  private freeWorkers: TaskInfoWorker<TResult>[] = [];
  private tasks: { task: TTask; callback: CallbackFn<TResult> }[] = [];

  constructor(workerURL: URL, numThreads: number) {
    super();

    for (let i = 0; i < numThreads; i++) this.addNewWorker(workerURL);

    // Any time the kWorkerFreedEvent is emitted, dispatch
    // the next task pending in the queue, if any.
    this.on(kWorkerFreedEvent, () => {
      if (this.tasks.length > 0) {
        const { task, callback } = this.tasks.shift()!;
        this.runTask(task, callback);
      }
    });
  }

  private addNewWorker(workerURL: URL) {
    const worker = new TaskInfoWorker(workerURL);

    worker.on("message", (result) => {
      // In case of success: Call the callback that was passed to `runTask`,
      // remove the `TaskInfo` associated with the Worker, and mark it as free
      // again.
      worker[kTaskInfo]?.done(null, result);
      worker[kTaskInfo] = null;
      this.freeWorkers.push(worker);
      this.emit(kWorkerFreedEvent);
    });

    worker.on("error", (err) => {
      // In case of an uncaught exception: Call the callback that was passed to
      // `runTask` with the error.
      if (worker[kTaskInfo]) worker[kTaskInfo]?.done(err, null);
      else this.emit("error", err);
      // Remove the worker from the list and start a new Worker to replace the
      // current one.
      this.workers.splice(this.workers.indexOf(worker), 1);
      this.addNewWorker(workerURL);
    });

    this.workers.push(worker);
    this.freeWorkers.push(worker);
    this.emit(kWorkerFreedEvent);
  }

  runTask(task: TTask, callback: CallbackFn<TResult>) {
    if (this.freeWorkers.length === 0) {
      // No free threads, wait until a worker thread becomes free.
      this.tasks.push({ task, callback });
      return;
    }

    const worker = this.freeWorkers.pop()!;
    worker[kTaskInfo] = new WorkerPoolTaskInfo(callback);
    worker.postMessage(task);
  }

  async close() {
    for (const worker of this.workers) {
      await worker.terminate();
    }
  }
}

export default WorkerPool;
