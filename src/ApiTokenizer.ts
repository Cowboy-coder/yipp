const Spec = [
  [/^\b(GET|POST|PATCH|PUT|DELETE|HEAD)\b/, 'API_METHOD'],

  [/^\/[^\s]*/, 'API_PATH'],

  [/^\bparams\b:/, 'API_PARAMS'],
  [/^\bquery\b:/, 'API_QUERY'],
  [/^\bbody\b:/, 'API_BODY'],
  [/^\bheaders\b:/, 'API_HEADERS'],
  [/^\d+:/, 'API_STATUS'],
  [/^\btype\b \b[a-zA-Z_]+\b/, 'TYPE_DECLARATION'],

  [/^\b[a-zA-Z][a-zA-Z_0-9_-]*\b:/, 'WORD_WITH_COLON'],

  [/^-?\d+\.\d+/, 'FLOAT_LITERAL'],
  [/^-?\d+/, 'INT_LITERAL'],
  [/^\b(true|false)\b/, 'BOOLEAN_LITERAL'],
  [/^"([^"\\]*(\\.[^"\\]*)*)"/, 'STRING_LITERAL'],
  [/^\b[a-zA-Z][a-zA-Z_0-9_-]*\b/, 'VARIABLE_TYPE'],

  [/^!/, '!'],

  [/^{/, '{'],
  [/^}/, '}'],
  [/^\[/, '['],
  [/^\]/, ']'],
  [/^\|/, '|'],

  // Comments
  [/^#.+/, null],
  // Whitespace
  [/\s+/, null],
] as const;

export type Token = {
  type: typeof Spec[number][1];
  value: string;
} | null;

export default class ApiTokenizer {
  private str: string;
  private cursor: number;

  constructor(str: string) {
    this.str = str;
    this.cursor = 0;
  }

  getNextToken(): Token {
    if (!this.hasMoreTokens()) {
      return null;
    }

    const str = this.str.slice(this.cursor);

    for (const [regExp, tokenType] of Spec) {
      const tokenValue = this.match(regExp, str);
      // No match, try next
      if (tokenValue === null) {
        continue;
      }

      // skip, for example whitespace
      if (tokenType === null) {
        return this.getNextToken();
      }

      return {
        type: tokenType,
        value: tokenValue,
      };
    }
    throw new SyntaxError(`Unexpected token "${str[0]}"`);
  }

  private match(regExp: RegExp, str: string) {
    const matched = regExp.exec(str);
    if (matched === null) {
      return null;
    }
    this.cursor += matched[0].length;
    return matched[0];
  }

  private hasMoreTokens() {
    return this.cursor < this.str.length;
  }
}