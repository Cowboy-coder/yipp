import ApiParser from "./ApiParser";
describe(ApiParser, () => {
  it("ApiDefinition with empty params", () => {
    const parser = new ApiParser();
    const program = `GET /users/:id {
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
          method: "GET",
          path: "/users/:id",
          params: {
            type: "AnonymousTypeDeclaration",
            fields: [],
          },
          query: null,
          body: null,
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
    const program = `POST /users {
      200: {
        id: String!
      }
    }`;
    expect(parser.parse(program)).toEqual({
      type: "Program",
      definitions: [
        {
          type: "ApiDefinition",
          method: "POST",
          path: "/users",
          params: null,
          query: null,
          body: null,
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
    const program = `PUT /users/:id {
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

    DELETE /users/:id {
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
          body: null,
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
    HEAD /users/:ids {
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
          body: null,
          query: null,
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
