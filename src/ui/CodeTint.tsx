import { C } from "../theme";

/** Light syntax tint: strings, keywords, numbers. A placeholder for the real
 *  CodeMirror 6 editor (ENGINE.md); intentionally minimal. */
export function CodeTint({ code }: { code: string }) {
  return (
    <>
      {code.split("\n").map((l, i) => {
        const parts = l.split(/(f?".*?"|\b(?:export|function|import|const|def|return|new)\b|\b\d+(?:\.\d+)?\b)/g).filter(Boolean);
        return (
          <div key={i} style={{ whiteSpace: "pre" }}>
            {parts.map((t, j) =>
              /^f?".*"$/.test(t) ? <span key={j} style={{ color: C.str }}>{t}</span>
              : /^(export|function|import|const|def|return|new)$/.test(t) ? <span key={j} style={{ color: C.kw }}>{t}</span>
              : /^\d+(\.\d+)?$/.test(t) ? <span key={j} style={{ color: C.num }}>{t}</span>
              : <span key={j}>{t}</span>)}
            {l === "" && "\u00a0"}
          </div>
        );
      })}
    </>
  );
}
