import ApiParser from "./ApiParser";
describe(ApiParser, () => {
  it("ApiDefinition with empty params", () => {
    const parser = new ApiParser();
    const program = `getUser: GET /users/:id {
      params: {}
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
            type: "AnonymousTypeDeclaration",
            fields: [],
          },
          query: undefined,
          body: undefined,
          responses: [
            {
              status: 200,
              body: {
                type: "AnonymousTypeDeclaration",
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
                type: "AnonymousTypeDeclaration",
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
            type: "AnonymousTypeDeclaration",
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
            type: "AnonymousTypeDeclaration",
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
            type: "AnonymousTypeDeclaration",
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
                type: "AnonymousTypeDeclaration",
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
      200: User!
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
            type: "AnonymousTypeDeclaration",
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
            type: "TypeReference",
            variableType: "UserFilterQuery",
            isRequired: false,
          },
          responses: [
            {
              status: 200,
              body: {
                type: "TypeReference",
                variableType: "User",
                isRequired: true,
              },
            },
            {
              status: 404,
              body: {
                type: "AnonymousTypeDeclaration",
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
      404: [Error!]!
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
            type: "AnonymousTypeDeclaration",
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
                type: "AnonymousTypeDeclaration",
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
                type: "TypeReference",
                variableType: "Array",
                isRequired: true,
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
});
