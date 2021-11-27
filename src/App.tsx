import { FC, useCallback, useEffect, useState } from 'react';
import { Node } from 'typescript';
import './index.css';
import { queryCode } from './engine';
import QueryEditor from './QueryEditor';
import Code, { HighlightedInterval, HighlightedIntervals } from './Code';
import { isSyntaxError } from './tsquery-util';
import Header from './Header';

const REG_EXPS: Record<string, RegExp> = {
  AllLineBreaks: /\n/g,

  LeadingWhitespace: /^\s+/,
  TrailingWhitespace: /\s+$/,
  TrailingCommaAndWhitespace: /,\s*$/,

  OnlyWhitespace: /^\s*$/,
};

const App: FC = () => {
  const [highlightedIntervals, setHighlightedIntervals] = useState<HighlightedIntervals>([]);
  const [query, setQuery] = useState<string>('');
  const [code, setCode] = useState<string>('');

  const handleQueryChange = useCallback((value: string | undefined) => {
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
    setHighlightedIntervals([]);

    try {
      const nodes = queryCode(code, query);
      const highlightedIntervals = nodes.map((node) => mapNodeToHighlightInterval(node));
      setHighlightedIntervals(highlightedIntervals);
    } catch (error) {
      if (isSyntaxError(error)) {
        return;
      }
      throw error;
    }
  }, [query, code]);

  // Layout
  return (
    <div className="App">
      <Header />
      <h2>Query</h2>
      <QueryEditor onChange={handleQueryChange} />
      <h2>Code</h2>
      <Code highlighted={highlightedIntervals} onChange={handleCodeChange} />
    </div>
  );
};

export default App;

function mapNodeToHighlightInterval(node: Node): HighlightedInterval {
  const fullText = node.getFullText();
  const leadingWhitespaceOffset = getFirstMatchLengthOrZero(fullText, REG_EXPS.LeadingWhitespace);
  const trailingWhitespaceOffset = getFirstMatchLengthOrZero(fullText, REG_EXPS.TrailingWhitespace);

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
