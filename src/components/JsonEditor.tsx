import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { Compartment, EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder,
} from "@codemirror/view";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { ThemeMode } from "../lib/types";

export const LARGE_INPUT = 1_500_000;

export type JsonEditorHandle = {
  getText: () => string;
  setText: (next: string, options?: { silent?: boolean }) => void;
};

type JsonEditorProps = {
  theme: ThemeMode;
  initialValue: string;
  onDocChange: () => void;
  onDropFile?: (file: File) => void;
};

const baseTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "13px",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    lineHeight: "1.5",
  },
  ".cm-content": {
    padding: "12px 0",
  },
  ".cm-line": {
    padding: "0 12px",
  },
  ".cm-gutters": {
    border: "none",
  },
});

const lightTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#ffffff",
      color: "#0f172a",
    },
    ".cm-content": {
      caretColor: "#0f172a",
    },
    ".cm-gutters": {
      backgroundColor: "#f8fafc",
      color: "#94a3b8",
    },
    ".cm-activeLine": {
      backgroundColor: "#f1f5f9",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#f1f5f9",
      color: "#64748b",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "#cbd5e1",
    },
    ".cm-cursor": {
      borderLeftColor: "#0f172a",
    },
  },
  { dark: false },
);

export const JsonEditor = forwardRef<JsonEditorHandle, JsonEditorProps>(function JsonEditor(
  { theme, initialValue, onDocChange, onDropFile },
  ref,
) {
  const parentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeComp = useRef(new Compartment());
  const langComp = useRef(new Compartment());
  const wrapComp = useRef(new Compartment());
  const largeRef = useRef(initialValue.length > LARGE_INPUT);
  const suppressRef = useRef(false);
  const onDocChangeRef = useRef(onDocChange);
  const onDropFileRef = useRef(onDropFile);

  onDocChangeRef.current = onDocChange;
  onDropFileRef.current = onDropFile;

  useImperativeHandle(ref, () => ({
    getText: () => viewRef.current?.state.doc.toString() ?? "",
    setText: (next, options) => {
      const view = viewRef.current;
      if (!view) return;
      if (view.state.doc.toString() === next) return;
      suppressRef.current = options?.silent === true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: next },
      });
      suppressRef.current = false;
    },
  }));

  useEffect(() => {
    if (!parentRef.current) return;

    const applySizeMode = (view: EditorView, length: number) => {
      const large = length > LARGE_INPUT;
      if (large === largeRef.current) return;
      largeRef.current = large;
      view.dispatch({
        effects: [
          langComp.current.reconfigure(large ? [] : json()),
          wrapComp.current.reconfigure(large ? [] : EditorView.lineWrapping),
        ],
      });
    };

    const view = new EditorView({
      parent: parentRef.current,
      state: EditorState.create({
        doc: initialValue,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          placeholder("粘贴 JSON，或把文件拖进来…"),
          baseTheme,
          themeComp.current.of(theme === "dark" ? oneDark : lightTheme),
          langComp.current.of(largeRef.current ? [] : json()),
          wrapComp.current.of(largeRef.current ? [] : EditorView.lineWrapping),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            if (!suppressRef.current) onDocChangeRef.current();
            const length = update.state.doc.length;
            if (length > LARGE_INPUT !== largeRef.current) {
              queueMicrotask(() => applySizeMode(update.view, length));
            }
          }),
          EditorView.domEventHandlers({
            dragover: (event) => {
              if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
            },
            drop: (event) => {
              const file = event.dataTransfer?.files[0];
              if (!file) return;
              event.preventDefault();
              onDropFileRef.current?.(file);
            },
          }),
        ],
      }),
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // EditorView is created once; theme/size switch through compartments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: themeComp.current.reconfigure(theme === "dark" ? oneDark : lightTheme),
    });
  }, [theme]);

  return <div ref={parentRef} className="cm-host min-h-0 flex-1 overflow-hidden" />;
});
