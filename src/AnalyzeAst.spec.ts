import AnalyzeAst from './AnalyzeAst';
import { parse } from './ApiParser';

describe(AnalyzeAst, () => {
  it('validates headers', () => {
    expect(() =>
      parse(`
      type NotValidHeader = {
        id: Int!
      }
      x: GET / {
        headers: NotValidHeader

        200: {
          body: {
            x: String!
          }
        }
      }
   `),
    ).toThrowErrorMatchingInlineSnapshot(`"This type can only contain fields of type String,StringLiteral"`);
  });

  it('validates query', () => {
    expect(() =>
      parse(`
      type NotValidQuery = {
        id: Boolean!
      }
      x: GET / {
        query: NotValidQuery

        200: {
          body: {
            x: String!
          }
        }
      }
   `),
    ).toThrowErrorMatchingInlineSnapshot(`"This type can only contain fields of type Int,Float,String"`);
  });

  it('validates reference errors', () => {
    expect(() =>
      parse(`
      x: GET / {
        200: {
          body: NotFound
        }
      }
   `),
    ).toThrowErrorMatchingInlineSnapshot(`"Type 'NotFound' not found"`);
  });

  it('validates reference on nested fields', () => {
    expect(() =>
      parse(`
      type Foo = {
        nested: {
          x: NestedNotFound!
        }
      }
   `),
    ).toThrowErrorMatchingInlineSnapshot(`"Type 'NestedNotFound' not found"`);
  });

  it('validates duplicate fields', () => {
    expect(() =>
      parse(`
      type Foo = {
        id: Boolean!
        id: String!
      }
   `),
    ).toThrowErrorMatchingInlineSnapshot(`"Field is already defined"`);
  });

  it('validates duplicate fields in nested object', () => {
    expect(() =>
      parse(`
      type Foo = {
        id: Boolean!
        x: {
          y: String
          y: String
        }
      }
   `),
    ).toThrowErrorMatchingInlineSnapshot(`"Field is already defined"`);
  });

  it('validates duplicate fields in header', () => {
    expect(() =>
      parse(`
      x: GET / {
        headers: {
          y: String
          y: String
        }
        200: {
          body: {
            x: String!
          }
        }
      }
   `),
    ).toThrowErrorMatchingInlineSnapshot(`"Field is already defined"`);
  });

  it('validates duplicate type declarations', () => {
    expect(() =>
      parse(`
        type Dupe {
          id: String
        }
        type Dupe {
          id: String
        }
   `),
    ).toThrowErrorMatchingInlineSnapshot(`"Duplicate type declaration"`);
  });

  it('validates duplicate api definitions', () => {
    expect(() =>
      parse(`
        getUser: GET / {
          200: {
            body: {
              id: String
            }
          }
        }
        getUser: GET / {
          200: {
            body: {
              id: String
            }
          }
        }
   `),
    ).toThrowErrorMatchingInlineSnapshot(`"Duplicate api definition"`);
  });
});
