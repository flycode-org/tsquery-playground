type SyntaxError = Error & { name: 'SyntaxError' };

export function isSyntaxError(error: unknown): error is SyntaxError {
  // can't rely on instanceof SyntaxError as errors from the esquery parser are not instances of the global SyntaxError
  return error instanceof Error && error.name === 'SyntaxError';
}
