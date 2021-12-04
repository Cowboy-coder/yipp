import chalk from 'chalk';
import { Token } from './ApiTokenizer';

const PrettyError = ({
  token,
  document,
  errorMessage,
  options,
}: {
  token: Token;
  document: string;
  errorMessage: string;
  options?: {
    color: boolean;
    contextVisible?: number;
  };
}): string => {
  const color = options?.color ?? true;
  const contextVisible = options?.contextVisible ?? 2;

  const errorMsg = color ? chalk.red(errorMessage) : errorMessage;
  if (!token) {
    return errorMsg;
  }
  const allLines = document.split('\n');

  const lines = [
    ...allLines.slice(Math.max(token.line - contextVisible - 1, 0), token.line - 1),
    ...allLines.slice(token.line - 1, Math.min(allLines.length, token.line + contextVisible)),
  ];

  const extra = Math.max(token.line - contextVisible - 1, 0);

  const padLength = (token.line + Math.min(contextVisible, lines.length)).toString().length + 1;
  lines[token.line - 1 - extra] =
    lines[token.line - 1 - extra] + `\n${''.padStart(padLength, ' ')}|${''.padStart(token.col + 1, ' ')}^ ${errorMsg}`;

  return lines
    .map((line, index) => {
      const actualLine = index + 1 + extra;
      const lineNumber =
        actualLine === token.line && color
          ? chalk.red(actualLine.toString().padStart(padLength, ' '))
          : actualLine.toString().padStart(padLength, ' ');

      return `${lineNumber}| ${line}`;
    })
    .join('\n');
};

export default PrettyError;
