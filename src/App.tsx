import { useCallback, useEffect, useState } from 'react';
import { Node } from 'typescript';
import './index.css';
import { queryCode } from './engine';
import QueryEditor from './QueryEditor';
import Code, { HighlightedInterval, HighlightedIntervals } from './Code';

const REG_EXPS: Record<string, RegExp> = {
  AllLineBreaks: /\n/g,

  LeadingWhitespace: /^\s+/,
  TrailingWhitespace: /\s+$/,
  TrailingCommaAndWhitespace: /,\s*$/,

  OnlyWhitespace: /^\s*$/,
};

export default function App() {
  const [highlightedIntervals, setHighlightedIntervals] = useState<HighlightedIntervals>([]);
  const [query, setQuery] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [syntaxError, setSyntaxError] = useState<Error>();

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
    setHighlightedIntervals([]);

    try {
      const nodes = queryCode(code, query);
      const highlightedIntervals = nodes.map((node) => mapNodeToHighlightInterval(node));
      setHighlightedIntervals(highlightedIntervals);
    } catch (error) {
      if (isSyntaxError(error)) {
        setSyntaxError(error);
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
      <QueryEditor onChange={handleQueryChange} />
      {syntaxError && syntaxError.toString()}
      <h2>Code</h2>
      <Code highlighted={highlightedIntervals} onChange={handleCodeChange} />
    </div>
  );
}

function isSyntaxError(error: unknown): error is Error & { name: 'SyntaxError' } {
  return (error as { name: string }).name === 'SyntaxError';
}

function mapNodeToHighlightInterval(node: Node): HighlightedInterval {
  const fullText = node.getFullText();
  const leadingWhitespaceOffset = getFirstMatchLengthOrZero(fullText, REG_EXPS.LeadingWhitespace);
  const trailingWhitespaceOffset = getFirstMatchLengthOrZero(fullText, REG_EXPS.TrailingWhitespace);

  /** @todo resolve column */
  return {
    startOffset: node.pos + leadingWhitespaceOffset,
    endOffset: node.end - trailingWhitespaceOffset,
  };
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
