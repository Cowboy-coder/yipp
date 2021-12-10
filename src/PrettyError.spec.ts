import ApiTokenizer from './ApiTokenizer';
import PrettyError from './PrettyError';

describe(PrettyError, () => {
  it('returns a pretty error', () => {
    const document = `
weirdsyntax
          GET login:
            x
          asd
    `.trim();
    const tokenizer = new ApiTokenizer(document);
    tokenizer.getNextToken(); // move past the `weirdsyntax`-token

    expect(
      PrettyError({
        token: tokenizer.getNextToken(),
        errorMessage: 'Unexpected error, you fool!',
        options: {
          color: false,
        },
      }),
    ).toEqual(
      [
        ' 1| weirdsyntax',
        ' 2|           GET login:',
        '  |           ^ Unexpected error, you fool!',
        ' 3|             x',
        ' 4|           asd',
      ].join('\n'),
    );
  });

  it('returns a pretty error in a window (less context)', () => {
    const document = `
weirdsyntax
          GET login:
            x
          asd
    `.trim();
    const tokenizer = new ApiTokenizer(document);
    tokenizer.getNextToken(); // move past the `weirdsyntax`-token
    expect(
      PrettyError({
        token: tokenizer.getNextToken(),
        errorMessage: 'Unexpected error, you fool!',
        options: {
          color: false,
          contextVisible: 1,
        },
      }),
    ).toEqual(
      [
        ' 1| weirdsyntax',
        ' 2|           GET login:',
        '  |           ^ Unexpected error, you fool!',
        ' 3|             x',
      ].join('\n'),
    );
  });

  it('returns a pretty error in a window (less context)', () => {
    const document = `
# some comment1
# some comment2
# some comment3
# some comment4
# some comment5
# some comment6
# some comment7
# some comment8
# some comment9
# some comment10
# some comment11
weirdsyntax
          GET login:
            x
          asd
# some comment16
# some comment17
# some comment18
# some comment19
# some comment20
# some comment21
# some comment22
# some comment23
# some comment24
    `.trim();
    const tokenizer = new ApiTokenizer(document);
    tokenizer.getNextToken(); // move past the `weirdsyntax`-token
    expect(
      PrettyError({
        token: tokenizer.getNextToken(),
        errorMessage: 'Unexpected error, you fool!',
        options: {
          color: false,
          contextVisible: 4,
        },
      }),
    ).toEqual(
      [
        '  9| # some comment9',
        ' 10| # some comment10',
        ' 11| # some comment11',
        ' 12| weirdsyntax',
        ' 13|           GET login:',
        '   |           ^ Unexpected error, you fool!',
        ' 14|             x',
        ' 15|           asd',
        ' 16| # some comment16',
        ' 17| # some comment17',
      ].join('\n'),
    );
  });

  it('works when line numbers is 1 char wide', () => {
    const document = `union Foo
type Header {
  authorization: String!
}
    `.trim();
    const tokenizer = new ApiTokenizer(document);
    expect(
      PrettyError({
        token: tokenizer.getNextToken(),
        errorMessage: 'Unexpected error, you fool etc etc etc!',
        options: {
          color: false,
        },
      }),
    ).toEqual(
      [
        ' 1| union Foo',
        '  | ^ Unexpected error, you fool etc etc etc!',
        ' 2| type Header {',
        ' 3|   authorization: String!',
      ].join('\n'),
    );
  });
});
