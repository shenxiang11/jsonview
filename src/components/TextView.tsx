import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";

type TextViewProps = {
  text: string;
};

export function TextView({ text }: TextViewProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => (text.length === 0 ? [""] : text.split("\n")), [text]);
  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 22,
    overscan: 20,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto font-mono text-[13px] overscroll-contain">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.index}
            className="absolute left-0 top-0 flex w-full"
            style={{ height: item.size, transform: `translateY(${item.start}px)` }}
          >
            <span className="w-12 shrink-0 pr-3 text-right text-[11px] leading-[22px] text-zinc-400">
              {item.index + 1}
            </span>
            <pre className="m-0 flex-1 overflow-hidden text-ellipsis whitespace-pre pr-4 leading-[22px] text-slate-700 dark:text-slate-200">
              {lines[item.index]}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
