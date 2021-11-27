import { FC, useCallback, useRef } from 'react';
import Editor, { EditorProps } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { tsquery } from '@phenomnomnominal/tsquery';
import { sanitizeQuery } from './engine';

const MONACO_MODEL_MARKER_OWNER = 'tsquery';

const QueryEditor: FC<Omit<EditorProps, 'defaultLanguage' | 'theme' | 'options' | 'onMount'>> = ({
  onChange,
  ...rest
}) => {
  const monacoRef = useRef<typeof Monaco>();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor>();
  const handleQueryMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    monacoRef.current = monaco;
    editorRef.current = editor;
    monaco.languages.css.cssDefaults.setOptions({
      validate: false,
    });
  }, []);

  const handleQueryChange = useCallback(
    (value: string | undefined, event: Monaco.editor.IModelContentChangedEvent) => {
      const monaco = monacoRef.current;
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (monaco && model && typeof value === 'string') {
        const sanitizedQuery = sanitizeQuery(value);
        const error = getSyntaxError(sanitizedQuery);
        if (!error) {
          monaco.editor.setModelMarkers(model, MONACO_MODEL_MARKER_OWNER, []);
        } else {
          if (model) {
            monaco.editor.setModelMarkers(model, MONACO_MODEL_MARKER_OWNER, [
              {
                ...getFullRange(model),
                severity: monaco.MarkerSeverity.Error,
                message: error.message,
              },
            ]);
          }
        }
      }

      if (onChange) {
        onChange(value, event);
      }
    },
    [onChange],
  );

  return (
    <Editor
      defaultLanguage="css"
      theme="vs-dark"
      onMount={handleQueryMount}
      onChange={handleQueryChange}
      options={{
        minimap: {
          enabled: false,
        },
      }}
      {...rest}
    />
  );
};

export default QueryEditor;

function getSyntaxError(query: string): Error | null {
  try {
    tsquery.parse(query);
    return null;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return error;
    }
    throw error;
  }
}

function getFullRange(model: Monaco.editor.ITextModel): {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
} {
  const lastLine = model.getLineCount();
  return {
    startLineNumber: 0,
    startColumn: 0,
    endLineNumber: lastLine,
    endColumn: model.getLineMaxColumn(lastLine),
  };
}
