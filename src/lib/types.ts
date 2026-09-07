export type JsonType = "object" | "array" | "string" | "number" | "boolean" | "null";

export type JsonStats = {
  bytes: number;
  nodes: number;
  depth: number;
  parseMs: number;
  rootType: JsonType;
};

export type ParseError = {
  message: string;
  line?: number;
  column?: number;
};

export type TreeRow = {
  id: string;
  key: string;
  depth: number;
  type: JsonType;
  preview: string;
  childCount: number;
  expandable: boolean;
  path: Array<string | number>;
  value: unknown;
};

export type ViewMode = "tree" | "text";
export type ThemeMode = "light" | "dark";
