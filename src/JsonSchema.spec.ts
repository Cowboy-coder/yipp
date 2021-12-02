import { JSONSchema7 } from 'json-schema';
import ApiParser from './ApiParser';
import JsonSchema from './JsonSchema';

describe(JsonSchema, () => {
  it('Different types', () => {
    const parser = new ApiParser();
    const program = `
    type Foo {
      a: "foo"!
      b: String
      c: -42!
      d: 42!
      e: Int
      f: Boolean
      g: true
      h: false
      i: 32.0
      j: -12.042
    }
    `;
    expect(JsonSchema(parser.parse(program))).toEqual<JSONSchema7[]>([
      {
        $id: 'https://example.com/#Foo',
        type: 'object',
        properties: {
          a: { const: 'foo' },
          b: { type: 'string' },
          c: { const: -42 },
          d: { const: 42 },
          e: { type: 'number' },
          f: { type: 'boolean' },
          g: { const: true },
          h: { const: false },
          i: { const: 32.0 },
          j: { const: -12.042 },
        },
        required: ['a', 'c', 'd'],
      },
    ]);
  });

  it('Nested type', () => {
    const parser = new ApiParser();
    const program = `
    type Foo {
      a: {
        b: {
          c: String!
        }
      }!
    }
    `;

    expect(JsonSchema(parser.parse(program))).toEqual<JSONSchema7[]>([
      {
        $id: 'https://example.com/#Foo',
        type: 'object',
        properties: {
          a: {
            type: 'object',
            properties: {
              b: {
                type: 'object',
                properties: {
                  c: { type: 'string' },
                },
                required: ['c'],
              },
            },
            required: [],
          },
        },
        required: ['a'],
      },
    ]);
  });

  it('Arrays', () => {
    const parser = new ApiParser();
    const program = `
    type Foo {
      a: [Test]!
      b: [Test!]
      c: [Test!]!
      d: [Test]
    }
    `;

    expect(JsonSchema(parser.parse(program))).toEqual<JSONSchema7[]>([
      {
        $id: 'https://example.com/#Foo',
        type: 'object',
        properties: {
          a: {
            type: 'array',
            items: {
              oneOf: [{ type: 'null' }, { $ref: 'https://example.com/#Test' }],
            },
          },
          b: {
            type: 'array',
            items: {
              $ref: 'https://example.com/#Test',
            },
          },
          c: {
            type: 'array',
            items: {
              $ref: 'https://example.com/#Test',
            },
          },
          d: {
            type: 'array',
            items: {
              oneOf: [{ type: 'null' }, { $ref: 'https://example.com/#Test' }],
            },
          },
        },
        required: ['a', 'c'],
      },
    ]);
  });

  it('Union type', () => {
    const parser = new ApiParser();
    const program = `
    type Foo
     | "foo"
     | String
     | -42
     | 42
     | Int
     | Boolean
     | true
     | false
     | 32.0
     | -12.042
    `;
    expect(JsonSchema(parser.parse(program))).toEqual<JSONSchema7[]>([
      {
        $id: 'https://example.com/#Foo',
        oneOf: [
          { const: 'foo' },
          { type: 'string' },
          { const: -42 },
          { const: 42 },
          { type: 'number' },
          { type: 'boolean' },
          { const: true },
          { const: false },
          { const: 32.0 },
          { const: -12.042 },
        ],
      },
    ]);
  });

  it('Complex Union type', () => {
    const parser = new ApiParser();
    const program = `
    type Error
     | { message: String! } 
     | { code: 404 message: "testing" }
     | "Foo"
     | 42
    `;
    expect(JsonSchema(parser.parse(program))).toEqual<JSONSchema7[]>([
      {
        $id: 'https://example.com/#Error',
        oneOf: [
          {
            type: 'object',
            properties: { message: { type: 'string' } },
            required: ['message'],
          },
          {
            type: 'object',
            properties: { code: { const: 404 }, message: { const: 'testing' } },
            required: [],
          },
          { const: 'Foo' },
          { const: 42 },
        ],
      },
    ]);
  });

  it('Api definition with type reference', () => {
    const parser = new ApiParser();
    const program = `
    type User {
      id: String!
    } 

    type Headers {
      x-header: "yo"!
    } 

    getUser: GET /user/:id {
      params: {
        id: String!
      }
      headers: Headers
      200: {
        body: {
          user: User!
        }
      }
      400: {
        body: User
      }
    }
    `;
    expect(JsonSchema(parser.parse(program))).toEqual<JSONSchema7[]>([
      {
        $id: 'https://example.com/#User',
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      {
        $id: 'https://example.com/#Headers',
        type: 'object',
        properties: { 'x-header': { const: 'yo' } },
        required: ['x-header'],
      },
      {
        $id: 'https://example.com/#getUser_params',
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      {
        $id: 'https://example.com/#getUser_headers',
        $ref: 'https://example.com/#Headers',
      },
      {
        $id: 'https://example.com/#getUser_200',
        type: 'object',
        properties: {
          user: {
            $ref: 'https://example.com/#User',
          },
        },
        required: ['user'],
      },
      {
        $id: 'https://example.com/#getUser_400',
        $ref: 'https://example.com/#User',
      },
    ]);
  });

  it('Complex Api definition with type reference, unions etc', () => {
    const parser = new ApiParser();
    const program = `
    type UserType
      | "Admin"
      | "User"

    type User {
      id: String!
      userType: [UserType]
    } 

    getUser: GET /user/:id {
      params: {
        id: String!
      }
      headers: {
        x: String!
      }
      200: {
        body: {
          user: User!
        }
      }
      400: {
        body: User
      }
      404: {
        body: {
          userType: UserType
          user: User
          nested: {
            a: String!
            b: Int
          }
        }
      }
    }
    `;
    expect(JsonSchema(parser.parse(program))).toEqual<JSONSchema7[]>([
      {
        $id: 'https://example.com/#UserType',
        oneOf: [{ const: 'Admin' }, { const: 'User' }],
      },
      {
        $id: 'https://example.com/#User',
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          userType: {
            type: 'array',
            items: {
              oneOf: [{ type: 'null' }, { $ref: 'https://example.com/#UserType' }],
            },
          },
        },
        required: ['id'],
      },
      {
        $id: 'https://example.com/#getUser_params',
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      {
        $id: 'https://example.com/#getUser_headers',
        type: 'object',
        properties: { x: { type: 'string' } },
        required: ['x'],
      },
      {
        $id: 'https://example.com/#getUser_200',
        type: 'object',
        properties: {
          user: {
            $ref: 'https://example.com/#User',
          },
        },
        required: ['user'],
      },
      {
        $id: 'https://example.com/#getUser_400',
        $ref: 'https://example.com/#User',
      },
      {
        $id: 'https://example.com/#getUser_404',
        type: 'object',
        properties: {
          userType: {
            $ref: 'https://example.com/#UserType',
          },
          user: {
            $ref: 'https://example.com/#User',
          },
          nested: {
            type: 'object',
            properties: {
              a: { type: 'string' },
              b: { type: 'number' },
            },
            required: ['a'],
          },
        },
        required: [],
      },
    ]);
  });
});
