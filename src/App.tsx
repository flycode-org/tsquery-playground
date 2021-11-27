import { FC, useCallback, useEffect, useRef, useState } from 'react';
import Editor, { OnChange } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { Node, ScriptKind } from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';
import './index.css';

type HighlightedInterval = {
  startOffset: number;
  endOffset: number;
};

type HighlightedIntervals = Array<HighlightedInterval>;

const RegExps = {
  AllLineBreaks: /\n/g,

  LeadingWhitespace: /^\s+/,
  TrailingWhitespace: /\s+$/,
  TrailingCommaAndWhitespace: /,\s*$/,

  OnlyWhitespace: /^\s*$/,
};

export default function App() {
  // State
  const [highlightedIntervals, setHighlightedIntervals] = useState<HighlightedIntervals>([]);
  const [query, setQuery] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [syntaxError, setSyntaxError] = useState<Error>();

  // Handlers
  const handleQueryMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    monaco.languages.css.cssDefaults.setOptions({
      validate: false,
    });
  }, []);

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

  // Effects
  useEffect(() => {
    if (!query) {
      return;
    }
    setSyntaxError(undefined);
    setHighlightedIntervals([]);

    try {
      const ast = tsquery.ast(code, undefined, ScriptKind.JSX);
      const sanitizedQuery = query
        .replace(RegExps.AllLineBreaks, ' ')
        .replace(RegExps.TrailingCommaAndWhitespace, '')
        .trim();

      const nodes = tsquery(ast, sanitizedQuery);
      const nonEmptyNodes = nodes.filter((node) => {
        const nodeText = getNodeText(node);

        return !isWhitespaceOnly(nodeText);
      });

      setHighlightedIntervals(
        nonEmptyNodes.map((node) => {
          const fullText = node.getFullText();
          const leadingWhitespaceOffset = getFirstMatchLengthOrZero(fullText, RegExps.LeadingWhitespace);
          const trailingWhitespaceOffset = getFirstMatchLengthOrZero(fullText, RegExps.TrailingWhitespace);

          /** @todo resolve column */
          return {
            startOffset: node.pos + leadingWhitespaceOffset,
            endOffset: node.end - trailingWhitespaceOffset,
          };
        }),
      );
    } catch (error) {
      if ((error as { name: string }).name === 'SyntaxError') {
        setSyntaxError(error as Error);
        return;
      }
      throw error;
    }
  }, [query, code]);

  // Layout
  return (
    <div className="App">
      <header>
        <h1>TSQuery Playground</h1>
        <aside>
          <a href="https://github.com/phenomnomnominal/tsquery#selectors">Reference</a>
          <a href="https://github.com/flycode-org/tsquery-playground">GitHub</a>
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
      <Code highlighted={highlightedIntervals} onChange={handleCodeChange} />
    </div>
  );
}

const Code: FC<{
  highlighted: HighlightedIntervals;
  onChange: OnChange;
}> = ({ highlighted, onChange }) => {
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

type NodeWithText = Node & {
  text: string;
};

function isNodeWithText<TNode extends Node>(node: Node): node is TNode & NodeWithText {
  return (node as TNode & NodeWithText).text != null;
}

function getNodeText(node: Node): string {
  if (isNodeWithText(node)) {
    return node.text;
  }

  return node.getFullText();
}

function isWhitespaceOnly(text: string): boolean {
  return RegExps.OnlyWhitespace.test(text);
}

function getFirstMatchLengthOrZero(text: string, regExp: RegExp): number {
  const firstMatch = getFirstMatchOrNull(text, regExp);
  return firstMatch != null ? firstMatch.length : 0;
}

function getFirstMatchOrNull(text: string, regExp: RegExp): string | null {
  const matches = text.match(regExp);
  if (!matches || matches.length === 0) {
    return null;
  }

  return matches[0];
}
