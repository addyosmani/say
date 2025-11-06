import { useState } from "react";

export interface MessageEventHandler {
  (event: MessageEvent): void;
}

export type WorkerType = "transcription" | "summarization";

export function useWorker(workerType: WorkerType, messageEventHandler: MessageEventHandler): Worker {
  // Create new worker once and never again
  const [worker] = useState(() => createWorker(workerType, messageEventHandler));
  return worker;
}

function createWorker(workerType: WorkerType, messageEventHandler: MessageEventHandler): Worker {
  let worker: Worker;
  switch (workerType) {
    case "transcription":
      worker = new Worker(new URL("../workers/transcription-worker.js", import.meta.url), {
          type: "module",
      });
      break;
    case "summarization":
      worker = new Worker(new URL("../workers/summarization-worker.js", import.meta.url), {
          type: "module",
      });
      break;
    default:
      throw new Error(`Unknown worker type: ${workerType}`);
  }
  // Listen for messages from the Web Worker
  worker.addEventListener("message", messageEventHandler);
  return worker;
}
