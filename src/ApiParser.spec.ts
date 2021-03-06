import { parse } from './ApiParser';

describe('ApiParser', () => {
  it('ApiDefinition with different types', () => {
    const program = `
    "with some documentation"
    getUser: GET /users/:id/:id2(Int)/:id3(Float) {
      "and body documentation"
      body: {
        "a is cool"
        a: "foo"!
        """
        Multi line
        documentation
        """
        b: String
        c: -42!
        """
        Multi line
          documentation
        with indentation
        """
        d: 42!
        e: Int
        f: Boolean
        g: true
        h: false
        i: 32.0
        j: -12.042
        k: DateTime
        with-dash: String
        "and field documentation"
        with_underscore: String
      }
      "200 OK!"
      200: {
        # with some comments
        body: {
          id: String! # more comment
        } 
      } # and even more
      404: {
        body: {
          id:String!
        }
      }
    }`;
    expect(parse(program)).toMatchObject({
      type: 'Document',
      definitions: [
        {
          type: 'ApiDefinition',
          docs: {
            type: 'Docs',
            value: 'with some documentation',
          },
          name: 'getUser',
          method: 'GET',
          path: '/users/:id/:id2/:id3',
          params: {
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
                name: 'id2',
                variableType: 'Int',
                isRequired: true,
              },
              {
                type: 'ObjectField',
                name: 'id3',
                variableType: 'Float',
                isRequired: true,
              },
            ],
          },
          body: {
            docs: {
              type: 'Docs',
              value: 'and body documentation',
            },
            variableType: 'Object',
            fields: [
              {
                type: 'ObjectField',
                name: 'a',
                variableType: 'StringLiteral',
                value: 'foo',
                isRequired: true,
                docs: {
                  type: 'Docs',
                  value: 'a is cool',
                  isMultiLine: false,
                },
              },
              {
                type: 'ObjectField',
                name: 'b',
                docs: {
                  type: 'Docs',
                  value: 'Multi line\ndocumentation',
                  isMultiLine: true,
                },
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
                docs: {
                  type: 'Docs',
                  value: 'Multi line\n  documentation\nwith indentation',
                  isMultiLine: true,
                },
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
                name: 'k',
                variableType: 'DateTime',
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
                docs: {
                  type: 'Docs',
                  value: 'and field documentation',
                  isMultiLine: false,
                },
              },
            ],
          },
          responses: [
            {
              type: 'ApiResponseDefinition',
              status: 200,
              docs: {
                type: 'Docs',
                value: '200 OK!',
                isMultiLine: false,
              },
              body: {
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
            {
              type: 'ApiResponseDefinition',
              status: 404,
              docs: undefined,
              body: {
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
    const program = `createUser: POST /users {
      200: {
        body: {
          id: String!
        }
      }
    }`;
    expect(parse(program)).toMatchObject({
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
    const program = `
    "enum docs"
    enum Color {
      red
      "blue comment"
      blue
    }
    "type docs"
    type Foobar {
      id: String
      nested: {
        "nested name docs"
        name: String
      }
    }
    type Nested2 {
      id: String
    }
    updateUser: PUT /users/:id {
      query: {
        foo: String!
        "color docs"
        color: Color!
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
    expect(parse(program)).toMatchObject({
      type: 'Document',
      definitions: [
        {
          type: 'EnumDeclaration',
          name: 'Color',
          docs: {
            type: 'Docs',
            value: 'enum docs',
          },
          fields: [
            {
              type: 'EnumField',
              name: 'red',
              variableType: 'StringLiteral',
              value: 'red',
            },
            {
              type: 'EnumField',
              name: 'blue',
              variableType: 'StringLiteral',
              value: 'blue',
              docs: {
                type: 'Docs',
                value: 'blue comment',
              },
            },
          ],
        },
        {
          type: 'TypeDeclaration',
          variableType: 'Object',
          name: 'Foobar',
          docs: {
            type: 'Docs',
            value: 'type docs',
          },
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
                  docs: {
                    type: 'Docs',
                    value: 'nested name docs',
                  },
                },
              ],
            },
          ],
        },
        {
          type: 'TypeDeclaration',
          variableType: 'Object',
          name: 'Nested2',
          fields: [
            {
              type: 'ObjectField',
              name: 'id',
              variableType: 'String',
              isRequired: false,
            },
          ],
        },
        {
          type: 'ApiDefinition',
          name: 'updateUser',
          method: 'PUT',
          path: '/users/:id',
          params: {
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
            variableType: 'Object',
            fields: [
              {
                type: 'ObjectField',
                name: 'foo',
                variableType: 'String',
                isRequired: true,
              },
              {
                type: 'ObjectField',
                name: 'color',
                variableType: 'TypeReference',
                value: 'Color',
                isRequired: true,
                docs: {
                  type: 'Docs',
                  value: 'color docs',
                },
              },
            ],
          },
          body: {
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
    const program = `
    type User {
      id: String!
    }
    type UserFilterQuery {
      filter: Float
    }

    deleteUser: DELETE /users/:id {
      query: UserFilterQuery
      200: {
        body: User
      }
      404: {
        body: {
          "error docs"
          error: String!
        }
      }
    }`;
    expect(parse(program)).toMatchObject({
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
          type: 'TypeDeclaration',
          name: 'UserFilterQuery',
          variableType: 'Object',
          fields: [
            {
              type: 'ObjectField',
              name: 'filter',
              variableType: 'Float',
              isRequired: false,
            },
          ],
        },
        {
          type: 'ApiDefinition',
          name: 'deleteUser',
          method: 'DELETE',
          path: '/users/:id',
          params: {
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
            variableType: 'TypeReference',
            value: 'UserFilterQuery',
          },
          responses: [
            {
              type: 'ApiResponseDefinition',
              status: 200,
              body: {
                variableType: 'TypeReference',
                value: 'User',
              },
            },
            {
              type: 'ApiResponseDefinition',
              status: 404,
              body: {
                variableType: 'Object',
                fields: [
                  {
                    type: 'ObjectField',
                    name: 'error',
                    variableType: 'String',
                    isRequired: true,
                    docs: {
                      type: 'Docs',
                      value: 'error docs',
                    },
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
    const program = `
    type Error {
      message: String!
    }
    randomFunc: HEAD /users/:ids {
      200: {
        body: {
          id: [String]
        }
      }
      404: {
        body: [Error!]
      }
    }`;
    expect(parse(program)).toMatchObject({
      type: 'Document',
      definitions: [
        {
          type: 'TypeDeclaration',
          variableType: 'Object',
          name: 'Error',
          fields: [
            {
              type: 'ObjectField',
              name: 'message',
              variableType: 'String',
              isRequired: true,
            },
          ],
        },
        {
          type: 'ApiDefinition',
          name: 'randomFunc',
          method: 'HEAD',
          path: '/users/:ids',
          params: {
            variableType: 'Object',
            fields: [
              {
                type: 'ObjectField',
                name: 'ids',
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

  it('Enums', () => {
    const program = `
    enum UserType {
      ADMIN
      USER
    }
    enum EnumWithValues {
      Foo = "A"
      Bar = "B"
    }
    `;
    expect(parse(program)).toMatchObject({
      type: 'Document',
      definitions: [
        {
          type: 'EnumDeclaration',
          name: 'UserType',
          fields: [
            {
              type: 'EnumField',
              name: 'ADMIN',
              variableType: 'StringLiteral',
              value: 'ADMIN',
            },
            {
              type: 'EnumField',
              name: 'USER',
              variableType: 'StringLiteral',
              value: 'USER',
            },
          ],
        },
        {
          type: 'EnumDeclaration',
          name: 'EnumWithValues',
          fields: [
            {
              type: 'EnumField',
              name: 'Foo',
              variableType: 'StringLiteral',
              value: 'A',
            },
            {
              type: 'EnumField',
              name: 'Bar',
              variableType: 'StringLiteral',
              value: 'B',
            },
          ],
        },
      ],
    });
  });

  it('UnionDeclaration', () => {
    const program = `
    type Photo {
      photoUrl: String!
      type: "Photo"!
    }

    type Video {
      videoUrl: String!
      type: "Video"!
    }

    "union docs"
    union Feed = Video | Photo, type
    `;
    expect(parse(program)).toMatchObject({
      type: 'Document',
      definitions: [
        {
          type: 'TypeDeclaration',
          variableType: 'Object',
          name: 'Photo',
          fields: [
            {
              type: 'ObjectField',
              name: 'photoUrl',
              variableType: 'String',
              isRequired: true,
            },
            {
              type: 'ObjectField',
              name: 'type',
              variableType: 'StringLiteral',
              value: 'Photo',
              isRequired: true,
            },
          ],
        },
        {
          type: 'TypeDeclaration',
          variableType: 'Object',
          name: 'Video',
          fields: [
            {
              type: 'ObjectField',
              name: 'videoUrl',
              variableType: 'String',
              isRequired: true,
            },
            {
              type: 'ObjectField',
              name: 'type',
              variableType: 'StringLiteral',
              value: 'Video',
              isRequired: true,
            },
          ],
        },
        {
          type: 'UnionDeclaration',
          name: 'Feed',
          docs: {
            type: 'Docs',
            value: 'union docs',
          },
          items: [
            {
              type: 'UnionItem',
              variableType: 'TypeReference',
              value: 'Video',
            },
            {
              type: 'UnionItem',
              variableType: 'TypeReference',
              value: 'Photo',
            },
          ],
        },
      ],
    });
  });

  describe('api groups', () => {
    it('works', () => {
      const program = `
      "docs"
      api Users {
        "docs1"
        foo1: GET /foo1 {
          200: {
            body: {
              id: String!
            } 
          }
        }
        "docs2"
        foo2: GET /foo2 {
          200: {
            body: {
              id: String!
            } 
          }
        }
      }
    `;
      expect(parse(program)).toMatchObject({
        type: 'Document',
        definitions: [
          {
            type: 'ApiGroup',
            name: 'Users',
            apis: [
              {
                type: 'ApiDefinition',
                docs: {
                  type: 'Docs',
                  value: 'docs1',
                },
                name: 'foo1',
                method: 'GET',
                path: '/foo1',
                responses: [
                  {
                    type: 'ApiResponseDefinition',
                    status: 200,
                    body: {
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
              {
                type: 'ApiDefinition',
                docs: {
                  type: 'Docs',
                  value: 'docs2',
                },
                name: 'foo2',
                method: 'GET',
                path: '/foo2',
                responses: [
                  {
                    type: 'ApiResponseDefinition',
                    status: 200,
                    body: {
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
            docs: {
              type: 'Docs',
              value: 'docs',
              isMultiLine: false,
            },
          },
        ],
      });
    });
  });
});
