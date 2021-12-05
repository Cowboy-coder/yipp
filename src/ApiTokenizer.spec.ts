import ApiTokenizer from './ApiTokenizer';

describe(ApiTokenizer, () => {
  it('parses tokens', () => {
    const tokenizer = new ApiTokenizer(`#comment\n type Foo {}`);
    expect(tokenizer.getNextToken()).toEqual({
      type: 'TYPE_DECLARATION',
      value: 'type Foo',
      start: 10,
      end: 18,
      line: 2,
      col: 1,
    });
  });

  it('parses tokens with correct start and end', () => {
    const tokenizer = new ApiTokenizer(`  type Foo {}`);
    expect(tokenizer.getNextToken()).toEqual({
      type: 'TYPE_DECLARATION',
      value: 'type Foo',
      start: 2,
      end: 10,
      line: 1,
      col: 2,
    });
  });

  it('parses several tokens', () => {
    const tokenizer = new ApiTokenizer(`login: GET /login {}`);
    expect(tokenizer.getNextToken()).toEqual({
      type: 'WORD_WITH_COLON',
      value: 'login:',
      start: 0,
      end: 6,
      line: 1,
      col: 0,
    });
    expect(tokenizer.getNextToken()).toEqual({
      type: 'API_METHOD',
      value: 'GET',
      start: 7,
      end: 10,
      line: 1,
      col: 7,
    });

    expect(tokenizer.getNextToken()).toEqual({
      type: 'API_PATH_SEGMENT',
      value: '/login',
      start: 11,
      end: 17,
      line: 1,
      col: 11,
    });

    expect(tokenizer.getNextToken()).toEqual({
      type: '{',
      value: '{',
      start: 18,
      end: 19,
      line: 1,
      col: 18,
    });

    expect(tokenizer.getNextToken()).toEqual({
      type: '}',
      value: '}',
      start: 19,
      end: 20,
      line: 1,
      col: 19,
    });

    const eof = { col: 20, end: 20, line: 1, start: 20, type: 'EOF', value: '' };

    expect(tokenizer.getNextToken()).toEqual(eof);
    expect(tokenizer.getNextToken()).toEqual(eof);
  });
});
