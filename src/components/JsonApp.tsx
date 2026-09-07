import {
  Braces,
  ClipboardCopy,
  Download,
  FolderOpen,
  Moon,
  Search,
  Sun,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { generateLargeSample, parseJson, stringifyJson } from "../lib/jsonClient";
import { formatBytes, pathLabel } from "../lib/jsonMeta";
import { SAMPLE_JSON } from "../lib/sample";
import { flattenTree, searchPaths } from "../lib/tree";
import type { JsonStats, ParseError, ThemeMode, TreeRow, ViewMode } from "../lib/types";
import { TextView } from "./TextView";
import { TreeView } from "./TreeView";

const LARGE_INPUT = 1_500_000;

export function JsonApp() {
  const [text, setText] = useState(SAMPLE_JSON);
  const [hiddenSource, setHiddenSource] = useState(false);
  const [value, setValue] = useState<unknown>(JSON.parse(SAMPLE_JSON));
  const [stats, setStats] = useState<JsonStats | null>(null);
  const [error, setError] = useState<ParseError | null>(null);
  const [busy, setBusy] = useState(false);
  const [repair, setRepair] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mode, setMode] = useState<ViewMode>("tree");
  const [pretty, setPretty] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["$"]));
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<string[]>([]);
  const [active, setActive] = useState<TreeRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (hiddenSource) return;
      void runParse(text);
    }, 180);
    return () => window.clearTimeout(handle);
  }, [text, repair, hiddenSource]);

  const rows = useMemo(() => (value === undefined ? [] : flattenTree(value, expanded)), [value, expanded]);

  useEffect(() => {
    if (!query.trim() || value === undefined) {
      setHits([]);
      return;
    }
    const handle = window.setTimeout(() => setHits(searchPaths(value, query)), 120);
    return () => window.clearTimeout(handle);
  }, [query, value]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const applyParsed = (next: { value: unknown; stats: JsonStats; repaired: boolean; text?: string }, source?: string) => {
    setValue(next.value);
    setStats(next.stats);
    setError(null);
    setExpanded(new Set(["$"]));
    setActive(null);
    if (source !== undefined) setText(source);
    if (next.repaired) showToast("已自动修复不规范 JSON");
  };

  const runParse = async (source: string) => {
    if (!source.trim()) {
      setValue(undefined);
      setStats(null);
      setError(null);
      return;
    }
    setBusy(true);
    try {
      applyParsed(await parseJson(source, repair));
    } catch (caught) {
      setError(caught as ParseError);
      setStats(null);
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const source = await file.text();
      const parsed = await parseJson(source, repair);
      if (source.length > LARGE_INPUT) {
        setHiddenSource(true);
        setText("");
        applyParsed(parsed);
        showToast(`已从文件加载 ${formatBytes(source.length)}，左侧不再塞进输入框以免卡顿`);
      } else {
        setHiddenSource(false);
        applyParsed(parsed, source);
      }
    } catch (caught) {
      setError(caught as ParseError);
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copy = async (content: string, label: string) => {
    await navigator.clipboard.writeText(content);
    showToast(label);
  };

  const download = async () => {
    const body = pretty || (await stringifyJson(value, 2));
    const blob = new Blob([body], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "data.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const switchText = async () => {
    setMode("text");
    if (!pretty && value !== undefined) {
      setBusy(true);
      try {
        setPretty(await stringifyJson(value, 2));
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 px-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-teal-600 text-xs font-bold text-white">
            {"{ }"}
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Jsonview</div>
            <div className="hidden text-[11px] text-slate-500 sm:block">超大 JSON 也不卡 · 无广告 · 本地解析</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs">
          {stats ? (
            <span className="hidden rounded-full bg-white px-2 py-1 text-slate-500 ring-1 ring-slate-200 sm:inline dark:bg-zinc-900 dark:ring-zinc-800">
              {formatBytes(stats.bytes)} · {stats.nodes.toLocaleString()} 节点 · {stats.parseMs}ms
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col border-r border-slate-200 dark:border-zinc-800">
          <div className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 px-2 text-xs dark:border-zinc-800">
            <Tool onClick={() => void runParse(text)}>解析</Tool>
            <Tool
              onClick={async () => {
                if (value === undefined) return;
                const next = await stringifyJson(value, 2);
                setHiddenSource(false);
                setText(next);
                setPretty(next);
              }}
            >
              格式化
            </Tool>
            <Tool
              onClick={async () => {
                if (value === undefined) return;
                const next = await stringifyJson(value, null);
                setHiddenSource(false);
                setText(next);
                setPretty(await stringifyJson(value, 2));
              }}
            >
              压缩
            </Tool>
            <Tool
              onClick={() => {
                setHiddenSource(false);
                setText(SAMPLE_JSON);
              }}
            >
              示例
            </Tool>
            <Tool
              onClick={async () => {
                setBusy(true);
                try {
                  const parsed = await generateLargeSample(20000);
                  setHiddenSource(true);
                  setText("");
                  setPretty("");
                  applyParsed(parsed);
                  showToast(`已生成 ${formatBytes(parsed.stats.bytes)} / ${parsed.stats.nodes.toLocaleString()} 节点`);
                } finally {
                  setBusy(false);
                }
              }}
            >
              2 万条大示例
            </Tool>
            <label className="ml-1 inline-flex items-center gap-1 text-slate-500">
              <input type="checkbox" checked={repair} onChange={(event) => setRepair(event.target.checked)} />
              自动修复
            </label>
            <button
              type="button"
              className="ml-auto inline-flex h-7 items-center gap-1 rounded px-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
              onClick={() => {
                setText("");
                setHiddenSource(false);
                setValue(undefined);
                setPretty("");
                setError(null);
                setStats(null);
              }}
            >
              <Trash2 size={14} />
              清空
            </button>
          </div>
          {hiddenSource ? (
            <button
              type="button"
              className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 bg-slate-100 px-6 text-center text-sm text-slate-500 dark:bg-zinc-900"
              onClick={() => document.getElementById("json-file")?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) void handleFile(file);
              }}
            >
              <FolderOpen size={28} />
              大文件已在 Worker 中解析，没有写进输入框。
              <span>继续拖入 .json，或点这里重新选择</span>
            </button>
          ) : (
            <textarea
              value={text}
              spellCheck={false}
              placeholder="粘贴 JSON，或把文件拖进来…"
              className="min-h-0 flex-1 resize-none border-0 bg-white p-3 font-mono text-[13px] leading-6 outline-none dark:bg-zinc-950"
              onChange={(event) => {
                setHiddenSource(false);
                setPretty("");
                setText(event.target.value);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) void handleFile(file);
              }}
            />
          )}
          <input
            id="json-file"
            type="file"
            accept=".json,application/json,text/plain"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
        </section>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex h-10 shrink-0 items-center gap-1 border-b border-slate-200 px-2 text-xs dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setMode("tree")}
              className={`rounded px-2 py-1 ${mode === "tree" ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-slate-500"}`}
            >
              树形
            </button>
            <button
              type="button"
              onClick={() => void switchText()}
              className={`rounded px-2 py-1 ${mode === "text" ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-slate-500"}`}
            >
              文本
            </button>
            <label className="ml-2 flex min-w-0 flex-1 items-center gap-1 rounded-md bg-white px-2 ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <Search size={14} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索 key / 字符串"
                className="h-7 min-w-0 flex-1 bg-transparent outline-none"
              />
              {hits.length > 0 ? <span className="text-slate-400">{hits.length}</span> : null}
            </label>
            <IconButton title="复制路径" onClick={() => active && void copy(pathLabel(active.path), "已复制路径")}>
              <ClipboardCopy size={14} />
            </IconButton>
            <IconButton
              title="复制值"
              onClick={() => active && void copy(JSON.stringify(active.value, null, 2), "已复制值")}
            >
              <Braces size={14} />
            </IconButton>
            <IconButton title="下载 JSON" onClick={() => void download()}>
              <Download size={14} />
            </IconButton>
          </div>

          <div className="min-h-0 flex-1 bg-white dark:bg-zinc-950">
            {error ? (
              <div className="p-4 text-sm text-rose-600">
                {error.message}
                {error.column ? <div className="mt-1 text-xs text-rose-400">position {error.column}</div> : null}
              </div>
            ) : mode === "tree" && value !== undefined ? (
              <TreeView
                rows={rows}
                expanded={expanded}
                hits={new Set(hits)}
                activeId={active?.id ?? null}
                onToggle={toggle}
                onSelect={setActive}
              />
            ) : mode === "text" ? (
              <TextView text={pretty} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">在左侧输入 JSON</div>
            )}
          </div>

          <div className="flex h-8 shrink-0 items-center justify-between border-t border-slate-200 px-3 text-[11px] text-slate-500 dark:border-zinc-800">
            <span>{busy ? "Worker 处理中…" : active ? pathLabel(active.path) : "解析在后台线程，页面保持可点"}</span>
            <span className="inline-flex items-center gap-1">
              <WandSparkles size={12} />
              只渲染可见行
            </span>
          </div>
        </section>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function Tool({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-7 rounded px-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

function IconButton({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}
