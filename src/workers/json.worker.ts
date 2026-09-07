import { jsonrepair } from "jsonrepair";
import { collectStats } from "../lib/tree";
import { jsonType } from "../lib/jsonMeta";
import type { JsonStats, ParseError } from "../lib/types";

type Incoming =
  | { id: number; type: "parse"; text: string; repair: boolean }
  | { id: number; type: "stringify"; value: unknown; space: number | null }
  | { id: number; type: "large-sample"; count: number };

function parsePosition(message: string): Pick<ParseError, "line" | "column"> {
  const match = message.match(/position\s+(\d+)/i);
  if (!match) return {};
  return { column: Number(match[1]) };
}

self.onmessage = (event: MessageEvent<Incoming>) => {
  const message = event.data;
  try {
    if (message.type === "parse") {
      const started = performance.now();
      const source = message.repair ? jsonrepair(message.text) : message.text;
      const value = JSON.parse(source) as unknown;
      const { nodes, depth } = collectStats(value);
      const stats: JsonStats = {
        bytes: new Blob([message.text]).size,
        nodes,
        depth,
        parseMs: Math.max(1, Math.round(performance.now() - started)),
        rootType: jsonType(value),
      };
      self.postMessage({ id: message.id, type: "parsed", value, stats, repaired: source !== message.text });
      return;
    }

    if (message.type === "stringify") {
      const text = JSON.stringify(message.value, null, message.space ?? undefined) ?? "";
      self.postMessage({ id: message.id, type: "text", text });
      return;
    }

    const items = Array.from({ length: message.count }, (_, index) => ({
      id: index + 1,
      name: `user_${index + 1}`,
      email: `user${index + 1}@example.com`,
      active: index % 3 !== 0,
      score: Math.round(Math.random() * 1000) / 10,
      tags: ["json", "demo", `n${index % 17}`],
      profile: {
        city: ["上海", "北京", "深圳", "杭州"][index % 4],
        age: 18 + (index % 40),
      },
    }));
    const value = {
      generated: true,
      count: message.count,
      note: "Generated in a worker so the UI stays responsive.",
      items,
    };
    const text = JSON.stringify(value, null, 2);
    const { nodes, depth } = collectStats(value);
    self.postMessage({
      id: message.id,
      type: "parsed",
      value,
      text,
      stats: {
        bytes: new Blob([text]).size,
        nodes,
        depth,
        parseMs: 0,
        rootType: jsonType(value),
      },
      repaired: false,
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "JSON parse error";
    self.postMessage({
      id: message.id,
      type: "error",
      error: { message: raw, ...parsePosition(raw) },
    });
  }
};
