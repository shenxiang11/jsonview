import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { TreeRow } from "../lib/types";

const TYPE_COLOR: Record<string, string> = {
  object: "text-sky-600 dark:text-sky-400",
  array: "text-violet-600 dark:text-violet-400",
  string: "text-emerald-600 dark:text-emerald-400",
  number: "text-amber-600 dark:text-amber-400",
  boolean: "text-rose-600 dark:text-rose-400",
  null: "text-zinc-400",
};

type TreeViewProps = {
  rows: TreeRow[];
  expanded: Set<string>;
  hits: Set<string>;
  activeId: string | null;
  onToggle: (id: string) => void;
  onSelect: (row: TreeRow) => void;
};

export function TreeView({ rows, expanded, hits, activeId, onToggle, onSelect }: TreeViewProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 16,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto font-mono text-[13px] overscroll-contain">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => {
          const row = rows[item.index];
          const open = expanded.has(row.id);
          return (
            <div
              key={row.id}
              className={`absolute left-0 top-0 flex w-full cursor-pointer items-center gap-1 pr-3 ${
                row.id === activeId
                  ? "bg-teal-50 dark:bg-teal-950/50"
                  : hits.has(row.id)
                    ? "bg-amber-50 dark:bg-amber-950/40"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
              style={{ height: item.size, transform: `translateY(${item.start}px)`, paddingLeft: 10 + row.depth * 16 }}
              onClick={() => onSelect(row)}
            >
              {row.expandable ? (
                <button
                  type="button"
                  className="inline-flex h-5 w-5 items-center justify-center text-zinc-400"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggle(row.id);
                  }}
                >
                  {row.childCount === 0 ? <span className="h-3 w-3" /> : open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <span className="w-5" />
              )}
              <span className="shrink-0 text-slate-500 dark:text-slate-400">{row.key}</span>
              <span className="text-zinc-300 dark:text-zinc-600">:</span>
              <span className={`truncate ${TYPE_COLOR[row.type]}`}>{row.preview}</span>
              {row.expandable && row.childCount > 0 ? (
                <span className="ml-auto shrink-0 text-[11px] text-zinc-400">{row.childCount}</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
