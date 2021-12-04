import ApiParser, { Ast } from './ApiParser';

describe(ApiParser, () => {
  it('ApiDefinition with different types', () => {
    const parser = new ApiParser();
    const program = `getUser: GET /users/:id {
      body: {
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
        with-dash: String
        with_underscore: String
      }
      200: {
        # with some comments
        body: {
          id: String! # more comment
        } 
      } # and even more
    }`;
    expect(parser.parse(program)).toEqual<Ast>({
      type: 'Document',
      definitions: [
        {
          type: 'ApiDefinition',
          name: 'getUser',
          method: 'GET',
          path: '/users/:id',
          body: {
            type: 'ApiFieldDefinition',
            variableType: 'Object',
            fields: [
              {
                type: 'ObjectField',
                name: 'a',
                variableType: 'StringLiteral',
                value: 'foo',
                isRequired: true,
              },
              {
                type: 'ObjectField',
                name: 'b',
                variableType: 'String',
                isRequired: false,
              },
              {
                type: 'ObjectField',
                name: 'c',
                variableType: 'IntLiteral',
                value: -42,
                isRequired: true,
              },
              {
                type: 'ObjectField',
                name: 'd',
                variableType: 'IntLiteral',
                value: 42,
                isRequired: true,
              },
              {
                type: 'ObjectField',
                name: 'e',
                variableType: 'Int',
                isRequired: false,
              },
              {
                type: 'ObjectField',
                name: 'f',
                variableType: 'Boolean',
                isRequired: false,
              },
              {
                type: 'ObjectField',
                name: 'g',
                variableType: 'BooleanLiteral',
                value: true,
                isRequired: false,
              },
              {
                type: 'ObjectField',
                name: 'h',
                variableType: 'BooleanLiteral',
                value: false,
                isRequired: false,
              },
              {
                type: 'ObjectField',
                name: 'i',
                variableType: 'FloatLiteral',
                value: 32.0,
                isRequired: false,
              },
              {
                type: 'ObjectField',
                name: 'j',
                variableType: 'FloatLiteral',
                value: -12.042,
                isRequired: false,
              },
              {
                type: 'ObjectField',
                name: 'with-dash',
                variableType: 'String',
                isRequired: false,
              },
              {
                type: 'ObjectField',
                name: 'with_underscore',
                variableType: 'String',
                isRequired: false,
              },
            ],
          },
          responses: [
            {
              type: 'ApiResponseDefinition',
              status: 200,
              body: {
                type: 'ApiFieldDefinition',
                variableType: 'Object',
                fields: [
                  {
                    type: 'ObjectField',
                    name: 'id',
                    variableType: 'String',
                    isRequired: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    });
  });

  it('ApiDefinition with no params', () => {
    const parser = new ApiParser();
    const program = `createUser: POST /users {
      200: {
        body: {
          id: String!
        }
      }
    }`;
    expect(parser.parse(program)).toEqual<Ast>({
      type: 'Document',
      definitions: [
        {
          type: 'ApiDefinition',
          name: 'createUser',
          method: 'POST',
          path: '/users',
          responses: [
            {
              type: 'ApiResponseDefinition',
              status: 200,
              body: {
                type: 'ApiFieldDefinition',
                variableType: 'Object',
                fields: [
                  {
                    type: 'ObjectField',
                    name: 'id',
                    variableType: 'String',
                    isRequired: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    });
  });

  it('Full Api definition', () => {
    const parser = new ApiParser();
    const program = `
    type Foobar {
      id: String
      nested: {
        name: String
      }
    }
    updateUser: PUT /users/:id {
      params: {
        id: String!
        name: String
        Boolean: Boolean
        age: Int!
      }
      query: {
        foo: String!
      }
      body: {
        id: String
        age: Int!
        nested: {
          id: String!
          foo: String!
        }!
        nested2: Nested2!
      }
      headers: {
        authorization: String!
      }
      200: {
        body: {
          id: String!
        }
        headers: {
          content-type: "application/json"
        }
      }
    }`;
    expect(parser.parse(program)).toEqual<Ast>({
      type: 'Document',
      definitions: [
        {
          type: 'TypeDeclaration',
          variableType: 'Object',
          name: 'Foobar',
          fields: [
            {
              type: 'ObjectField',
              name: 'id',
              variableType: 'String',
              isRequired: false,
            },
            {
              type: 'ObjectField',
              name: 'nested',
              variableType: 'Object',
              isRequired: false,
              fields: [
                {
                  type: 'ObjectField',
                  name: 'name',
                  variableType: 'String',
                  isRequired: false,
                },
              ],
            },
          ],
        },
        {
          type: 'ApiDefinition',
          name: 'updateUser',
          method: 'PUT',
          path: '/users/:id',
          params: {
            type: 'ApiFieldDefinition',
            variableType: 'Object',
            fields: [
              {
                type: 'ObjectField',
                name: 'id',
                variableType: 'String',
                isRequired: true,
              },
              {
                type: 'ObjectField',
                name: 'name',
                variableType: 'String',
                isRequired: false,
              },
              {
                type: 'ObjectField',
                name: 'Boolean',
                variableType: 'Boolean',
                isRequired: false,
              },
              {
                type: 'ObjectField',
                name: 'age',
                variableType: 'Int',
                isRequired: true,
              },
            ],
          },
          query: {
            type: 'ApiFieldDefinition',
            variableType: 'Object',
            fields: [
              {
                type: 'ObjectField',
                name: 'foo',
                variableType: 'String',
                isRequired: true,
              },
            ],
          },
          body: {
            type: 'ApiFieldDefinition',
            variableType: 'Object',
            fields: [
              {
                type: 'ObjectField',
                name: 'id',
                variableType: 'String',
                isRequired: false,
              },
              {
                type: 'ObjectField',
                name: 'age',
                variableType: 'Int',
                isRequired: true,
              },
              {
                type: 'ObjectField',
                name: 'nested',
                variableType: 'Object',
                fields: [
                  {
                    type: 'ObjectField',
                    name: 'id',
                    variableType: 'String',
                    isRequired: true,
                  },
                  {
                    type: 'ObjectField',
                    name: 'foo',
                    variableType: 'String',
                    isRequired: true,
                  },
                ],
                isRequired: true,
              },
              {
                type: 'ObjectField',
                name: 'nested2',
                variableType: 'TypeReference',
                value: 'Nested2',
                isRequired: true,
              },
            ],
          },
          headers: {
            type: 'ApiFieldDefinition',
            variableType: 'Object',
            fields: [
              {
                type: 'ObjectField',
                name: 'authorization',
                variableType: 'String',
                isRequired: true,
              },
            ],
          },
          responses: [
            {
              type: 'ApiResponseDefinition',
              status: 200,
              body: {
                type: 'ApiFieldDefinition',
                variableType: 'Object',
                fields: [
                  {
                    type: 'ObjectField',
                    name: 'id',
                    variableType: 'String',
                    isRequired: true,
                  },
                ],
              },
              headers: {
                type: 'ApiFieldDefinition',
                variableType: 'Object',
                fields: [
                  {
                    type: 'ObjectField',
                    name: 'content-type',
                    variableType: 'StringLiteral',
                    value: 'application/json',
                    isRequired: false,
                  },
                ],
              },
            },
          ],
        },
      ],
    });
  });

  it('Api Definition with Types and Type references', () => {
    const parser = new ApiParser();
    const program = `
    type User {
      id: String!
    }

    deleteUser: DELETE /users/:id {
      params: {
        id: String!
      }
      query: UserFilterQuery
      200: {
        body: User
      }
      404: {
        body: {
          error: String!
        }
      }
    }`;
    expect(parser.parse(program)).toEqual<Ast>({
      type: 'Document',
      definitions: [
        {
          type: 'TypeDeclaration',
          name: 'User',
          variableType: 'Object',
          fields: [
            {
              type: 'ObjectField',
              name: 'id',
              variableType: 'String',
              isRequired: true,
            },
          ],
        },
        {
          type: 'ApiDefinition',
          name: 'deleteUser',
          method: 'DELETE',
          path: '/users/:id',
          params: {
            type: 'ApiFieldDefinition',
            variableType: 'Object',
            fields: [
              {
                type: 'ObjectField',
                name: 'id',
                variableType: 'String',
                isRequired: true,
              },
            ],
          },
          query: {
            type: 'ApiFieldDefinition',
            variableType: 'TypeReference',
            value: 'UserFilterQuery',
          },
          responses: [
            {
              type: 'ApiResponseDefinition',
              status: 200,
              body: {
                type: 'ApiFieldDefinition',
                variableType: 'TypeReference',
                value: 'User',
              },
            },
            {
              type: 'ApiResponseDefinition',
              status: 404,
              body: {
                type: 'ApiFieldDefinition',
                variableType: 'Object',
                fields: [
                  {
                    type: 'ObjectField',
                    name: 'error',
                    variableType: 'String',
                    isRequired: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    });
  });

  it('Api Definition with arrays', () => {
    const parser = new ApiParser();
    const program = `
    randomFunc: HEAD /users/:ids {
      params: {
        ids: [String!]!
      }
      200: {
        body: {
          id: [String]
        }
      }
      404: {
        body: [Error!]
      }
    }`;
    expect(parser.parse(program)).toEqual<Ast>({
      type: 'Document',
      definitions: [
        {
          type: 'ApiDefinition',
          name: 'randomFunc',
          method: 'HEAD',
          path: '/users/:ids',
          params: {
            type: 'ApiFieldDefinition',
            variableType: 'Object',
            fields: [
              {
                type: 'ObjectField',
                name: 'ids',
                variableType: 'Array',
                isRequired: true,
                items: {
                  variableType: 'String',
                  isRequired: true,
                },
              },
            ],
          },
          responses: [
            {
              type: 'ApiResponseDefinition',
              status: 200,
              body: {
                type: 'ApiFieldDefinition',
                variableType: 'Object',
                fields: [
                  {
                    type: 'ObjectField',
                    name: 'id',
                    isRequired: false,
                    variableType: 'Array',
                    items: {
                      variableType: 'String',
                      isRequired: false,
                    },
                  },
                ],
              },
            },
            {
              type: 'ApiResponseDefinition',
              status: 404,
              body: {
                type: 'ApiFieldDefinition',
                variableType: 'Array',
                items: {
                  variableType: 'TypeReference',
                  value: 'Error',
                  isRequired: true,
                },
              },
            },
          ],
        },
      ],
    });
  });

  it('ApiDefinition with unions', () => {
    const parser = new ApiParser();
    const program = `
    type UserType
      | {q: String}
      | "admin"
      | "user"
      | "thug"
      | 49
      | -49
      | 12.12
      | -32.02
      | true
      | false
      | String
      | Int
      | SomeType


    createUser: POST /users {
      body: {
        username: String!
        userType: UserType!
      }
      200: {
        body: {
          id: String!
          test: | "foo" | "bar" | "baz" | SomeType | { a: String }!
        }
      }
    }`;
    expect(parser.parse(program)).toEqual<Ast>({
      type: 'Document',
      definitions: [
        {
          type: 'TypeDeclaration',
          variableType: 'Union',
          name: 'UserType',
          unions: [
            {
              type: 'UnionItem',
              variableType: 'Object',
              fields: [
                {
                  type: 'ObjectField',
                  name: 'q',
                  variableType: 'String',
                  isRequired: false,
                },
              ],
            },
            {
              type: 'UnionItem',
              variableType: 'StringLiteral',
              value: 'admin',
            },
            {
              type: 'UnionItem',
              variableType: 'StringLiteral',
              value: 'user',
            },
            {
              type: 'UnionItem',
              variableType: 'StringLiteral',
              value: 'thug',
            },
            {
              type: 'UnionItem',
              variableType: 'IntLiteral',
              value: 49,
            },
            {
              type: 'UnionItem',
              value: -49,
              variableType: 'IntLiteral',
            },
            {
              type: 'UnionItem',
              value: 12.12,
              variableType: 'FloatLiteral',
            },
            {
              type: 'UnionItem',
              value: -32.02,
              variableType: 'FloatLiteral',
            },
            {
              type: 'UnionItem',
              value: true,
              variableType: 'BooleanLiteral',
            },
            {
              type: 'UnionItem',
              value: false,
              variableType: 'BooleanLiteral',
            },
            {
              type: 'UnionItem',
              variableType: 'String',
            },
            {
              type: 'UnionItem',
              variableType: 'Int',
            },
            {
              type: 'UnionItem',
              variableType: 'TypeReference',
              value: 'SomeType',
            },
          ],
        },
        {
          type: 'ApiDefinition',
          name: 'createUser',
          method: 'POST',
          path: '/users',
          body: {
            type: 'ApiFieldDefinition',
            variableType: 'Object',
            fields: [
              {
                type: 'ObjectField',
                name: 'username',
                variableType: 'String',
                isRequired: true,
              },
              {
                type: 'ObjectField',
                name: 'userType',
                variableType: 'TypeReference',
                value: 'UserType',
                isRequired: true,
              },
            ],
          },
          responses: [
            {
              type: 'ApiResponseDefinition',
              status: 200,
              body: {
                type: 'ApiFieldDefinition',
                variableType: 'Object',
                fields: [
                  {
                    type: 'ObjectField',
                    name: 'id',
                    variableType: 'String',
                    isRequired: true,
                  },
                  {
                    type: 'ObjectField',
                    name: 'test',
                    variableType: 'Union',
                    unions: [
                      {
                        type: 'UnionItem',
                        variableType: 'StringLiteral',
                        value: 'foo',
                      },
                      {
                        type: 'UnionItem',
                        variableType: 'StringLiteral',
                        value: 'bar',
                      },
                      {
                        type: 'UnionItem',
                        variableType: 'StringLiteral',
                        value: 'baz',
                      },
                      {
                        type: 'UnionItem',
                        variableType: 'TypeReference',
                        value: 'SomeType',
                      },
                      {
                        type: 'UnionItem',
                        variableType: 'Object',
                        fields: [
                          {
                            type: 'ObjectField',
                            name: 'a',
                            variableType: 'String',
                            isRequired: false,
                          },
                        ],
                      },
                    ],
                    isRequired: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    });
  });
});
