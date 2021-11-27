import { Node, ScriptKind } from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';
import './index.css';

type NodeWithText = Node & {
  text: string;
};

const REG_EXPS: Record<string, RegExp> = {
  AllLineBreaks: /\n/g,

  LeadingWhitespace: /^\s+/,
  TrailingWhitespace: /\s+$/,
  TrailingCommaAndWhitespace: /,\s*$/,

  OnlyWhitespace: /^\s*$/,
};

export function queryCode(code: string, query: string): Node[] {
  const ast = tsquery.ast(code, undefined, ScriptKind.JSX);
  const sanitizedQuery = sanitizeQuery(query);
  const nodes = tsquery(ast, sanitizedQuery);
  const nonEmptyNodes = nodes.filter((node) => !isWhitespaceOnlyNode(node));
  return nonEmptyNodes;
}

function sanitizeQuery(query: string): string {
  return query.replace(REG_EXPS.AllLineBreaks, ' ').replace(REG_EXPS.TrailingCommaAndWhitespace, '').trim();
}

function isNodeWithText<TNode extends Node>(node: Node): node is TNode & NodeWithText {
  return (node as TNode & NodeWithText).text != null;
}

function getNodeText(node: Node): string {
  if (isNodeWithText(node)) {
    return node.text;
  }

  return node.getFullText();
}

function isWhitespaceOnlyNode(node: Node): boolean {
  const nodeText = getNodeText(node);
  return isWhitespaceOnly(nodeText);
}

function isWhitespaceOnly(text: string): boolean {
  return REG_EXPS.OnlyWhitespace.test(text);
}
