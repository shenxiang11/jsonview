import { childCount, jsonType, pathId, previewValue } from "./jsonMeta";
import type { TreeRow } from "./types";

export function flattenTree(root: unknown, expanded: Set<string>): TreeRow[] {
  const rows: TreeRow[] = [];

  const walk = (value: unknown, path: Array<string | number>, key: string) => {
    const type = jsonType(value);
    const count = childCount(value);
    const id = pathId(path);
    const expandable = type === "object" || type === "array";
    rows.push({
      id,
      key,
      depth: path.length,
      type,
      preview: previewValue(value),
      childCount: count,
      expandable,
      path,
      value,
    });

    if (!expandable || !expanded.has(id) || count === 0) return;

    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        walk(value[index], [...path, index], String(index));
      }
      return;
    }

    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      walk(childValue, [...path, childKey], childKey);
    }
  };

  walk(root, [], "$");
  return rows;
}

export function collectStats(root: unknown): { nodes: number; depth: number } {
  let nodes = 0;
  let depth = 0;

  const walk = (value: unknown, level: number) => {
    nodes += 1;
    if (level > depth) depth = level;
    if (Array.isArray(value)) {
      for (const item of value) walk(item, level + 1);
      return;
    }
    if (value && typeof value === "object") {
      for (const item of Object.values(value)) walk(item, level + 1);
    }
  };

  walk(root, 1);
  return { nodes, depth };
}

export function searchPaths(root: unknown, query: string, limit = 200): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const hits: string[] = [];

  const walk = (value: unknown, path: Array<string | number>, key: string) => {
    if (hits.length >= limit) return;
    const id = pathId(path);
    const keyHit = key.toLowerCase().includes(needle);
    const valueHit =
      typeof value === "string"
        ? value.toLowerCase().includes(needle)
        : typeof value === "number" || typeof value === "boolean"
          ? String(value).toLowerCase().includes(needle)
          : false;
    if (keyHit || valueHit) hits.push(id);
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, [...path, index], String(index)));
      return;
    }
    if (value && typeof value === "object") {
      for (const [childKey, childValue] of Object.entries(value)) {
        walk(childValue, [...path, childKey], childKey);
      }
    }
  };

  walk(root, [], "$");
  return hits;
}
