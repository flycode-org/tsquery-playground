import { FC, useCallback, useEffect, useRef, useState } from 'react';
import Editor, { OnChange } from '@monaco-editor/react';
import * as Monaco from 'monaco-editor';

export type HighlightedInterval = {
  startOffset: number;
  endOffset: number;
};

export type HighlightedIntervals = HighlightedInterval[];

export type CodeProps = {
  highlighted: HighlightedIntervals;
  onChange: OnChange;
};

const Code: FC<CodeProps> = ({ highlighted, onChange }) => {
  const [instances, setInstances] = useState<[Monaco.editor.IStandaloneCodeEditor, typeof Monaco] | null>(null);

  /** @todo https://microsoft.github.io/monaco-editor/api/modules/monaco.editor.html#setmodelmarkers */
  const decorationsRef = useRef<string[]>([]);
  const handleMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    setInstances([editor, monaco]);
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
    });
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSuggestionDiagnostics: true,
      noSyntaxValidation: true,
    });
  }, []);

  const handleChange = useCallback(
    (value: string | undefined, ev: Monaco.editor.IModelContentChangedEvent) => {
      onChange(value, ev);
    },
    [onChange],
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

    const newDecorations = highlighted.map(({ startOffset, endOffset }) => {
      const start = model.getPositionAt(startOffset);
      const end = model.getPositionAt(endOffset);

      return {
        range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
        options: {
          inlineClassName: 'highlighted',
        },
      };
    });
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [instances, highlighted]);
  return <Editor defaultLanguage="typescript" theme="vs-dark" onMount={handleMount} onChange={handleChange} />;
};

export default Code;
