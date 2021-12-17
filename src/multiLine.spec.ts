import multiLine from './multiLine';

describe(multiLine, () => {
  it('does the right thing', () => {
    expect(multiLine('foo')).toEqual('foo');
    expect(multiLine(' foo')).toEqual('foo');
    expect(multiLine('foo ')).toEqual('foo');
    expect(multiLine('foo\nbar')).toEqual('foo\nbar');
    expect(multiLine(' foo\nbar')).toEqual('foo\nbar');
    expect(multiLine('foo\n bar')).toEqual('foo\n bar');
    expect(multiLine(' foo\n  bar')).toEqual('foo\n bar');
    expect(multiLine('  \nfoo\nbar')).toEqual('foo\nbar');
    expect(multiLine('  \n foo\n  bar')).toEqual('foo\n bar');
    expect(multiLine('   \n  foo\n   bar')).toEqual('foo\n bar');
    expect(multiLine('   \n  foo\n    bar')).toEqual('foo\n  bar');
  });
});
