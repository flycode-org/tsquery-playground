import { FC, useCallback } from 'react';
import Editor, { EditorProps } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';

const QueryEditor: FC<Omit<EditorProps, 'defaultLanguage' | 'theme' | 'options' | 'onMount'>> = (props) => {
  const handleQueryMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    monaco.languages.css.cssDefaults.setOptions({
      validate: false,
    });
  }, []);

  return (
    <Editor
      defaultLanguage="css"
      theme="vs-dark"
      onMount={handleQueryMount}
      options={{
        minimap: {
          enabled: false,
        },
      }}
      {...props}
    />
  );
};

export default QueryEditor;
