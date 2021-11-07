import { FC, useCallback, useEffect, useRef, useState } from "react";
import Editor, { OnChange } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { ScriptKind } from "typescript";
import { tsquery } from "@phenomnomnominal/tsquery";
import "./index.css";

type Highlighted = Array<[number, number]>;

export default function App() {
  const [highlighted, setHighlighted] = useState<Highlighted>([]);
  const [query, setQuery] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [syntaxError, setSyntaxError] = useState<Error>();
  const handleQueryMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
      monaco.languages.css.cssDefaults.setOptions({
        validate: false,
      });
    },
    []
  );
  const handleQueryChange = useCallback((value: string | undefined) => {
    setSyntaxError(undefined);
    if (value) {
      setQuery(value);
    }
  }, []);
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (value) {
      setCode(value);
    }
  }, []);

  useEffect(() => {
    if (!query) {
      return;
    }
    setSyntaxError(undefined);
    setHighlighted([]);
    try {
      const ast = tsquery.ast(code, undefined, ScriptKind.JSX);
      const sanitizedQuery = query.replace(/\n/g, " ").replace(/,\s*$/, "").trim();
      const nodes = tsquery(ast, sanitizedQuery);
      setHighlighted(
        nodes.map((node) => {
          /** @todo resolve column */
          return [node.pos, node.end];
        })
      );
    } catch (error) {
      if ((error as { name: string }).name === "SyntaxError") {
        setSyntaxError(error as Error);
        return;
      }
      throw error;
    }
  }, [query, code]);

  return (
    <div className="App">
      <header>
        <h1>TSQuery Playground</h1>
        <aside>
          <a href="https://github.com/phenomnomnominal/tsquery#selectors">
            Reference
          </a>
          <a href="https://github.com/iddan/tsquery-playground">GitHub</a>
        </aside>
      </header>
      <h2>Query</h2>
      <Editor
        defaultLanguage="css"
        theme="vs-dark"
        onChange={handleQueryChange}
        onMount={handleQueryMount}
        options={{
          minimap: {
            enabled: false,
          },
        }}
      />
      {syntaxError && syntaxError.toString()}
      <h2>Code</h2>
      <Code highlighted={highlighted} onChange={handleCodeChange} />
    </div>
  );
}

const Code: FC<{
  highlighted: Highlighted;
  onChange: OnChange;
}> = ({ highlighted, onChange }) => {
  const [instances, setInstances] = useState<
    [Monaco.editor.IStandaloneCodeEditor, typeof Monaco] | null
  >(null);
  /** @todo https://microsoft.github.io/monaco-editor/api/modules/monaco.editor.html#setmodelmarkers */
  const decorationsRef = useRef<string[]>([]);
  const handleMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
      setInstances([editor, monaco]);
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        jsx: monaco.languages.typescript.JsxEmit.React,
      });
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSuggestionDiagnostics: true,
        noSyntaxValidation: true,
      });
    },
    []
  );
  const handleChange = useCallback(
    (
      value: string | undefined,
      ev: Monaco.editor.IModelContentChangedEvent
    ) => {
      onChange(value, ev);
    },
    [onChange]
  );
  useEffect(() => {
    if (!instances) {
      return;
    }
    const [editor, monaco] = instances;

    const model = editor.getModel();

    if (!model) {
      return;
    }

    const newDecorations = highlighted.map(([startOffset, endOffset]) => {
      const start = model.getPositionAt(startOffset);
      const end = model.getPositionAt(endOffset);
      return {
        range: new monaco.Range(
          start.lineNumber,
          start.column,
          end.lineNumber,
          end.column
        ),
        options: {
          inlineClassName: "highlighted",
        },
      };
    });
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [instances, highlighted]);
  return (
    <Editor
      defaultLanguage="typescript"
      theme="vs-dark"
      onMount={handleMount}
      onChange={handleChange}
    />
  );
};
