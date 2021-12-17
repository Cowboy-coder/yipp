// The string:
// "
// foo
//  bar
// "
// becomes `foo\n bar`
const multiLine = (str: string) => {
  const firstLine = str.split('\n')[0];
  const isFirstLineOnlyWhitespace = firstLine.trim().length === 0;
  const leadingColumn = (isFirstLineOnlyWhitespace ? str.slice(firstLine.length + 1) : str).search(/[^\s]+/);
  return str
    .trim()
    .split('\n')
    .map((x) => {
      const s = x.search(/[^\s]+/);
      return ''.padStart(Math.max(s - leadingColumn, 0), ' ') + x.slice(s, x.length);
    })
    .join('\n');
};

export default multiLine;
