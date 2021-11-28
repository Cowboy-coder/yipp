import ApiParser from "./ApiParser";
describe(ApiParser, () => {
  it("ApiDefinition with empty params", () => {
    const parser = new ApiParser();
    const program = `getUser: GET /users/:id {
      params: {
        x: "foo"
        y: 42!
      }
      200: {
        id: String!
      }
    }`;
    expect(parser.parse(program)).toEqual({
      type: "Program",
      definitions: [
        {
          type: "ApiDefinition",
          name: "getUser",
          method: "GET",
          path: "/users/:id",
          params: {
            type: "ApiFieldDefinition",
            variableType: "AnonymousTypeDeclaration",
            fields: [
              {
                type: "FieldDefinition",
                id: "x",
                variableType: '"foo"',
                isRequired: false,
              },
              {
                type: "FieldDefinition",
                id: "y",
                variableType: 42,
                isRequired: true,
              },
            ],
          },
          query: undefined,
          body: undefined,
          responses: [
            {
              status: 200,
              body: {
                type: "ApiFieldDefinition",
                variableType: "AnonymousTypeDeclaration",
                fields: [
                  {
                    type: "FieldDefinition",
                    id: "id",
                    variableType: "String",
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

  it("ApiDefinition with no params", () => {
    const parser = new ApiParser();
    const program = `createUser: POST /users {
      200: {
        id: String!
      }
    }`;
    expect(parser.parse(program)).toEqual({
      type: "Program",
      definitions: [
        {
          type: "ApiDefinition",
          name: "createUser",
          method: "POST",
          path: "/users",
          params: undefined,
          query: undefined,
          body: undefined,
          responses: [
            {
              status: 200,
              body: {
                type: "ApiFieldDefinition",
                variableType: "AnonymousTypeDeclaration",
                fields: [
                  {
                    type: "FieldDefinition",
                    id: "id",
                    variableType: "String",
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

  it("Full Api definition", () => {
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
      200: {
        id: String!
      }
    }`;
    expect(parser.parse(program)).toEqual({
      type: "Program",
      definitions: [
        {
          type: "TypeDeclaration",
          name: "Foobar",
          fields: [
            {
              type: "FieldDefinition",
              id: "id",
              variableType: "String",
              isRequired: false,
            },
            {
              type: "FieldDefinition",
              id: "nested",
              variableType: "AnonymousTypeDeclaration",
              isRequired: false,
              fields: [
                {
                  type: "FieldDefinition",
                  id: "name",
                  variableType: "String",
                  isRequired: false,
                },
              ],
            },
          ],
        },
        {
          type: "ApiDefinition",
          name: "updateUser",
          method: "PUT",
          path: "/users/:id",
          params: {
            type: "ApiFieldDefinition",
            variableType: "AnonymousTypeDeclaration",
            fields: [
              {
                type: "FieldDefinition",
                id: "id",
                variableType: "String",
                isRequired: true,
              },
              {
                type: "FieldDefinition",
                id: "name",
                variableType: "String",
                isRequired: false,
              },
              {
                type: "FieldDefinition",
                id: "Boolean",
                variableType: "Boolean",
                isRequired: false,
              },
              {
                type: "FieldDefinition",
                id: "age",
                variableType: "Int",
                isRequired: true,
              },
            ],
          },
          query: {
            type: "ApiFieldDefinition",
            variableType: "AnonymousTypeDeclaration",
            fields: [
              {
                type: "FieldDefinition",
                id: "foo",
                variableType: "String",
                isRequired: true,
              },
            ],
          },
          body: {
            type: "ApiFieldDefinition",
            variableType: "AnonymousTypeDeclaration",
            fields: [
              {
                type: "FieldDefinition",
                id: "id",
                variableType: "String",
                isRequired: false,
              },
              {
                type: "FieldDefinition",
                id: "age",
                variableType: "Int",
                isRequired: true,
              },
              {
                type: "FieldDefinition",
                id: "nested",
                variableType: "AnonymousTypeDeclaration",
                fields: [
                  {
                    type: "FieldDefinition",
                    id: "id",
                    variableType: "String",
                    isRequired: true,
                  },
                  {
                    type: "FieldDefinition",
                    id: "foo",
                    variableType: "String",
                    isRequired: true,
                  },
                ],
                isRequired: true,
              },
              {
                type: "FieldDefinition",
                id: "nested2",
                variableType: "Nested2",
                isRequired: true,
              },
            ],
          },
          responses: [
            {
              status: 200,
              body: {
                type: "ApiFieldDefinition",
                variableType: "AnonymousTypeDeclaration",
                fields: [
                  {
                    type: "FieldDefinition",
                    id: "id",
                    variableType: "String",
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

  it("Api Definition with Types and Type references", () => {
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
      200: User
      404: {
        error: String!
      }
    }`;
    expect(parser.parse(program)).toEqual({
      type: "Program",
      definitions: [
        {
          type: "TypeDeclaration",
          name: "User",
          fields: [
            {
              type: "FieldDefinition",
              id: "id",
              variableType: "String",
              isRequired: true,
            },
          ],
        },
        {
          type: "ApiDefinition",
          name: "deleteUser",
          method: "DELETE",
          path: "/users/:id",
          params: {
            type: "ApiFieldDefinition",
            variableType: "AnonymousTypeDeclaration",
            fields: [
              {
                type: "FieldDefinition",
                id: "id",
                variableType: "String",
                isRequired: true,
              },
            ],
          },
          body: undefined,
          query: {
            type: "ApiFieldDefinition",
            variableType: "UserFilterQuery",
          },
          responses: [
            {
              status: 200,
              body: {
                type: "ApiFieldDefinition",
                variableType: "User",
              },
            },
            {
              status: 404,
              body: {
                type: "ApiFieldDefinition",
                variableType: "AnonymousTypeDeclaration",
                fields: [
                  {
                    type: "FieldDefinition",
                    id: "error",
                    variableType: "String",
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

  it("Api Definition with arrays", () => {
    const parser = new ApiParser();
    const program = `
    randomFunc: HEAD /users/:ids {
      params: {
        ids: [String!]!
      }
      200: {
        id: [String]
      }
      404: [Error!]
    }`;
    expect(parser.parse(program)).toEqual({
      type: "Program",
      definitions: [
        {
          type: "ApiDefinition",
          name: "randomFunc",
          method: "HEAD",
          path: "/users/:ids",
          params: {
            type: "ApiFieldDefinition",
            variableType: "AnonymousTypeDeclaration",
            fields: [
              {
                type: "FieldDefinition",
                id: "ids",
                variableType: "Array",
                isRequired: true,
                item: {
                  variableType: "String",
                  isRequired: true,
                },
              },
            ],
          },
          body: undefined,
          query: undefined,
          responses: [
            {
              status: 200,
              body: {
                type: "ApiFieldDefinition",
                variableType: "AnonymousTypeDeclaration",
                fields: [
                  {
                    type: "FieldDefinition",
                    id: "id",
                    variableType: "Array",
                    isRequired: false,
                    item: {
                      variableType: "String",
                      isRequired: false,
                    },
                  },
                ],
              },
            },
            {
              status: 404,
              body: {
                type: "ApiFieldDefinition",
                variableType: "Array",
                item: {
                  variableType: "Error",
                  isRequired: true,
                },
              },
            },
          ],
        },
      ],
    });
  });

  it("ApiDefinition with unions", () => {
    const parser = new ApiParser();
    const program = `
    type UserType
      | {q: String}
      | "admin"
      | "user"
      | "thug"
      | 49


    createUser: POST /users {
      body: {
        username: String!
        userType: UserType!
      }
      200: {
        id: String!
        test: | "foo" | "bar" | "baz" | SomeType | { a: String }!
      }
    }`;
    expect(parser.parse(program)).toEqual({
      type: "Program",
      definitions: [
        {
          type: "UnionDeclaration",
          name: "UserType",
          unions: [
            {
              type: "UnionItem",
              variableType: "AnonymousTypeDeclaration",
              fields: [
                {
                  type: "FieldDefinition",
                  id: "q",
                  variableType: "String",
                  isRequired: false,
                },
              ],
            },
            {
              type: "UnionItem",
              variableType: '"admin"',
            },
            {
              type: "UnionItem",
              variableType: '"user"',
            },
            {
              type: "UnionItem",
              variableType: '"thug"',
            },
            {
              type: "UnionItem",
              variableType: 49,
            },
          ],
        },
        {
          type: "ApiDefinition",
          name: "createUser",
          method: "POST",
          path: "/users",
          body: {
            type: "ApiFieldDefinition",
            variableType: "AnonymousTypeDeclaration",
            fields: [
              {
                type: "FieldDefinition",
                id: "username",
                variableType: "String",
                isRequired: true,
              },
              {
                type: "FieldDefinition",
                id: "userType",
                variableType: "UserType",
                isRequired: true,
              },
            ],
          },
          params: undefined,
          query: undefined,
          responses: [
            {
              status: 200,
              body: {
                type: "ApiFieldDefinition",
                variableType: "AnonymousTypeDeclaration",
                fields: [
                  {
                    type: "FieldDefinition",
                    id: "id",
                    variableType: "String",
                    isRequired: true,
                  },
                  {
                    type: "FieldDefinition",
                    id: "test",
                    variableType: "UnionDeclaration",
                    unions: [
                      {
                        type: "UnionItem",
                        variableType: '"foo"',
                      },
                      {
                        type: "UnionItem",
                        variableType: '"bar"',
                      },
                      {
                        type: "UnionItem",
                        variableType: '"baz"',
                      },
                      {
                        type: "UnionItem",
                        variableType: "SomeType",
                      },
                      {
                        type: "UnionItem",
                        variableType: "AnonymousTypeDeclaration",
                        fields: [
                          {
                            type: "FieldDefinition",
                            id: "a",
                            variableType: "String",
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
