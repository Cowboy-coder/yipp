import ApiTokenizer from './ApiTokenizer';

describe(ApiTokenizer, () => {
  it('parses tokens', () => {
    const document = `#comment\n type Foo {}`;
    const tokenizer = new ApiTokenizer(document);
    expect(tokenizer.getNextToken()).toEqual({
      type: 'TYPE_DECLARATION',
      value: 'type Foo',
      start: 10,
      end: 18,
      line: 2,
      col: 1,
      document,
    });
  });

  it('parses tokens with correct start and end', () => {
    const document = `  type Foo {}`;
    const tokenizer = new ApiTokenizer(document);
    expect(tokenizer.getNextToken()).toEqual({
      type: 'TYPE_DECLARATION',
      value: 'type Foo',
      start: 2,
      end: 10,
      line: 1,
      col: 2,
      document,
    });
  });

  it('parses several tokens', () => {
    const document = `login: GET /login {}`;
    const tokenizer = new ApiTokenizer(document);
    expect(tokenizer.getNextToken()).toEqual({
      type: 'WORD_WITH_COLON',
      value: 'login:',
      start: 0,
      end: 6,
      line: 1,
      col: 0,
      document,
    });
    expect(tokenizer.getNextToken()).toEqual({
      type: 'API_METHOD',
      value: 'GET',
      start: 7,
      end: 10,
      line: 1,
      col: 7,
      document,
    });

    expect(tokenizer.getNextToken()).toEqual({
      type: 'API_PATH_SEGMENT',
      value: '/login',
      start: 11,
      end: 17,
      line: 1,
      col: 11,
      document,
    });

    expect(tokenizer.getNextToken()).toEqual({
      type: '{',
      value: '{',
      start: 18,
      end: 19,
      line: 1,
      col: 18,
      document,
    });

    expect(tokenizer.getNextToken()).toEqual({
      type: '}',
      value: '}',
      start: 19,
      end: 20,
      line: 1,
      col: 19,
      document,
    });

    const eof = { col: 20, end: 20, line: 1, start: 20, type: 'EOF', value: '', document };

    expect(tokenizer.getNextToken()).toEqual(eof);
    expect(tokenizer.getNextToken()).toEqual(eof);
  });
});
