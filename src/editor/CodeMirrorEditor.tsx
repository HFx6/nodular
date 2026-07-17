// The one CodeMirror component: pane (in-node peek, auto-height) and rail
// (focused side editor) variants. The EditorView lives entirely in refs with a
// mount-only effect; onChange goes through a ref so prop churn never tears the
// editor down (also the React Compiler safety valve — no changing closures in
// the mount effect).

import { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { editorExtensions, foldLargeTopLevel } from "./extensions";

interface CodeMirrorEditorProps {
  code: string;
  lang: string;
  variant: "pane" | "rail";
  readOnly?: boolean;
  /** fixed pixel height (resized node) — the editor scrolls internally */
  height?: number;
  onChange: (code: string) => void;
}

export function CodeMirrorEditor({ code, lang, variant, readOnly = false, height, onChange }: CodeMirrorEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const readOnlyComp = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const heightRef = useRef(height);
  heightRef.current = height;

  const applyHeight = (v: EditorView, h: number | undefined) => {
    v.scrollDOM.style.overflow = h !== undefined ? "auto" : "";
    v.dom.style.height = h !== undefined ? `${h}px` : "";
  };

  // mount once per lang/variant; destroy cleanly (StrictMode-safe)
  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: view.current?.state.doc.toString() ?? code,
        extensions: [
          editorExtensions(lang, variant),
          readOnlyComp.current.of(EditorState.readOnly.of(readOnly)),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current(u.state.doc.toString());
          }),
        ],
      }),
    });
    applyHeight(v, heightRef.current);
    // the in-node pane opens with big top-level blocks collapsed (#6)
    if (variant === "pane") foldLargeTopLevel(v);
    view.current = v;
    return () => { v.destroy(); view.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- code/readOnly sync in their own effects
  }, [lang, variant]);

  // inbound sync: external code changes (undo/redo, rail↔pane, import)
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const cur = v.state.doc.toString();
    if (cur !== code) {
      v.dispatch({ changes: { from: 0, to: cur.length, insert: code } });
    }
  }, [code]);

  useEffect(() => {
    view.current?.dispatch({ effects: readOnlyComp.current.reconfigure(EditorState.readOnly.of(readOnly)) });
  }, [readOnly]);

  // fixed-height panes scroll internally (the pane theme's default is overflow: hidden)
  useEffect(() => {
    if (view.current) applyHeight(view.current, height);
  }, [height]);

  return (
    <div
      ref={host}
      style={variant === "rail" ? { flex: 1, minHeight: 0, overflow: "hidden" } : undefined}
      // focus fallback: if the browser's native mousedown→focus chain was
      // swallowed anywhere upstream, explicitly hand focus to the editor
      onClick={() => {
        const v = view.current;
        if (v && !v.hasFocus && !readOnly) v.focus();
      }}
    />
  );
}
