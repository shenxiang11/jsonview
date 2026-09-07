import type { JsonStats, ParseError } from "./types";

type Parsed = {
  value: unknown;
  stats: JsonStats;
  repaired: boolean;
  text?: string;
};

type WorkerOk =
  | { id: number; type: "parsed"; value: unknown; stats: JsonStats; repaired: boolean; text?: string }
  | { id: number; type: "text"; text: string }
  | { id: number; type: "error"; error: ParseError };

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (value: never) => void; reject: (error: ParseError) => void }>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("../workers/json.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<WorkerOk>) => {
      const job = pending.get(event.data.id);
      if (!job) return;
      pending.delete(event.data.id);
      if (event.data.type === "error") {
        job.reject(event.data.error);
        return;
      }
      job.resolve(event.data as never);
    };
  }
  return worker;
}

function call<T>(payload: object) {
  const id = (seq += 1);
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (value: never) => void, reject });
    getWorker().postMessage({ id, ...payload });
  });
}

export function parseJson(text: string, repair: boolean) {
  return call<WorkerOk & { type: "parsed" }>({ type: "parse", text, repair }).then((result) => {
    const parsed: Parsed = {
      value: result.value,
      stats: result.stats,
      repaired: result.repaired,
      text: result.text,
    };
    return parsed;
  });
}

export function stringifyJson(value: unknown, space: number | null) {
  return call<{ type: "text"; text: string }>({ type: "stringify", value, space }).then((result) => result.text);
}

export function generateLargeSample(count: number) {
  return call<WorkerOk & { type: "parsed" }>({ type: "large-sample", count }).then((result) => ({
    value: result.value,
    stats: result.stats,
    repaired: false,
    text: result.text ?? JSON.stringify(result.value),
  }));
}
