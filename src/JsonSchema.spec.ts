import { JSONSchema7 } from 'json-schema';
import { parse } from './ApiParser';
import JsonSchema from './JsonSchema';

describe(JsonSchema, () => {
  it('Different types', () => {
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
      k: DateTime
      with-dash: String
      with_underscore: String
    }
    `;
    expect(JsonSchema(parse(program))).toEqual<JSONSchema7>({
      $id: 'schema',
      type: 'object',
      definitions: {
        Foo: {
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
            k: { type: 'string', format: 'date-time' },
            'with-dash': { type: 'string' },
            with_underscore: { type: 'string' },
          },
          required: ['a', 'c', 'd'],
        },
      },
    });
  });

  it('Nested type', () => {
    const program = `
      type Foo {
        a: {
          b: {
            c: String!
          }
        }!
      }
      `;

    expect(JsonSchema(parse(program))).toEqual<JSONSchema7>({
      $id: 'schema',
      type: 'object',
      definitions: {
        Foo: {
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
      },
    });
  });

  it('Arrays', () => {
    const program = `
      type Test {
        id: String!
      }
      type Foo {
        a: [Test]!
        b: [Test!]
        c: [Test!]!
        d: [Test]
      }
      `;

    expect(JsonSchema(parse(program))).toEqual<JSONSchema7>({
      $id: 'schema',
      type: 'object',
      definitions: {
        Test: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
          },
          required: ['id'],
        },
        Foo: {
          type: 'object',
          properties: {
            a: {
              type: 'array',
              items: {
                oneOf: [{ type: 'null' }, { $ref: '#/definitions/Test' }],
              },
            },
            b: {
              type: 'array',
              items: {
                $ref: '#/definitions/Test',
              },
            },
            c: {
              type: 'array',
              items: {
                $ref: '#/definitions/Test',
              },
            },
            d: {
              type: 'array',
              items: {
                oneOf: [{ type: 'null' }, { $ref: '#/definitions/Test' }],
              },
            },
          },
          required: ['a', 'c'],
        },
      },
    });
  });

  it('Union type', () => {
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
    expect(JsonSchema(parse(program))).toEqual<JSONSchema7>({
      $id: 'schema',
      type: 'object',
      definitions: {
        Foo: {
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
      },
    });
  });

  it('Complex Union type', () => {
    const program = `
      type Error
       | { message: String! }
       | { code: 404 message: "testing" }
       | "Foo"
       | 42
      `;
    expect(JsonSchema(parse(program))).toEqual<JSONSchema7>({
      $id: 'schema',
      type: 'object',
      definitions: {
        Error: {
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
      },
    });
  });

  it('Api definition with type reference', () => {
    const program = `
      type User {
        id: String!
      }

      type Headers {
        x-header: "yo"!
      }

      getUser: GET /user/:id {
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
    expect(JsonSchema(parse(program))).toEqual<JSONSchema7>({
      $id: 'schema',
      type: 'object',
      definitions: {
        User: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        Headers: {
          type: 'object',
          properties: { 'x-header': { const: 'yo' } },
          required: ['x-header'],
        },
        getUser_params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        getUser_headers: {
          $ref: '#/definitions/Headers',
        },
        getUser_200: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/definitions/User',
            },
          },
          required: ['user'],
        },
        getUser_400: {
          $ref: '#/definitions/User',
        },
      },
    });
  });

  it('Complex Api definition with type reference, unions etc', () => {
    const program = `
      type UserType
        | "Admin"
        | "User"

      type User {
        id: String!
        userType: [UserType]
      }

      getUser: GET /user/:id {
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
    expect(JsonSchema(parse(program))).toEqual<JSONSchema7>({
      $id: 'schema',
      type: 'object',
      definitions: {
        UserType: {
          oneOf: [{ const: 'Admin' }, { const: 'User' }],
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            userType: {
              type: 'array',
              items: {
                oneOf: [{ type: 'null' }, { $ref: '#/definitions/UserType' }],
              },
            },
          },
          required: ['id'],
        },
        getUser_params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        getUser_headers: {
          type: 'object',
          properties: { x: { type: 'string' } },
          required: ['x'],
        },
        getUser_200: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/definitions/User',
            },
          },
          required: ['user'],
        },
        getUser_400: {
          $ref: '#/definitions/User',
        },
        getUser_404: {
          type: 'object',
          properties: {
            userType: {
              $ref: '#/definitions/UserType',
            },
            user: {
              $ref: '#/definitions/User',
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
      },
    });
  });
});
