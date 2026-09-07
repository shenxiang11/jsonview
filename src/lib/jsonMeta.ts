import type { JsonType } from "./types";

export function jsonType(value: unknown): JsonType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const kind = typeof value;
  if (kind === "string" || kind === "number" || kind === "boolean") return kind;
  return "object";
}

export function childCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

export function previewValue(value: unknown, max = 80): string {
  const type = jsonType(value);
  if (type === "string") {
    const text = JSON.stringify(value);
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }
  if (type === "number" || type === "boolean" || type === "null") return String(value);
  if (type === "array") return `Array(${(value as unknown[]).length})`;
  return `Object(${Object.keys(value as object).length})`;
}

export function pathId(path: Array<string | number>): string {
  return path.length === 0 ? "$" : `$.${path.map(String).join(".")}`;
}

export function pathLabel(path: Array<string | number>): string {
  if (path.length === 0) return "$";
  return path
    .map((part) => (typeof part === "number" ? `[${part}]` : part.includes(".") || part.includes(" ") ? `["${part}"]` : `.${part}`))
    .join("")
    .replace(/^\./, "$.");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
