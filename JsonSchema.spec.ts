import { JSONSchema7 } from "json-schema";
import ApiParser from "./ApiParser";
import JsonSchema from "./JsonSchema";

describe(JsonSchema, () => {
  it("Simple type", () => {
    const parser = new ApiParser();
    const program = `
    type Foo {
      id: String!
      age: Int
      fixed: 42
      funny: "LOL"
    }
    `;
    expect(JsonSchema(parser.parse(program))).toEqual<JSONSchema7[]>([
      {
        $id: "https://example.com/#Foo",
        type: "object",
        properties: {
          id: { type: "string" },
          age: { type: "number" },
          fixed: { const: 42 },
          funny: { const: "LOL" },
        },
        required: ["id"],
      },
    ]);
  });

  it("Nested type", () => {
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

    expect(JsonSchema(parser.parse(program))).toEqual([
      {
        $id: "https://example.com/#Foo",
        type: "object",
        properties: {
          a: {
            type: "object",
            properties: {
              b: {
                type: "object",
                properties: {
                  c: { type: "string" },
                },
                required: ["c"],
              },
            },
            required: [],
          },
        },
        required: ["a"],
      },
    ]);
  });

  it("Arrays", () => {
    const parser = new ApiParser();
    const program = `
    type Foo {
      a: [Test]!
      b: [Test!]
      c: [Test!]!
      d: [Test]
    }
    `;

    expect(JsonSchema(parser.parse(program))).toEqual([
      {
        $id: "https://example.com/#Foo",
        type: "object",
        properties: {
          a: {
            type: "array",
            items: {
              oneOf: [{ type: "null" }, { $ref: "https://example.com/#Test" }],
            },
          },
          b: {
            type: "array",
            items: {
              $ref: "https://example.com/#Test",
            },
          },
          c: {
            type: "array",
            items: {
              $ref: "https://example.com/#Test",
            },
          },
          d: {
            type: "array",
            items: {
              oneOf: [{ type: "null" }, { $ref: "https://example.com/#Test" }],
            },
          },
        },
        required: ["a", "c"],
      },
    ]);
  });

  it("Simple Union type", () => {
    const parser = new ApiParser();
    const program = `
    type UserType
     | "Admin"
     | "User"
     | "Editor"
     | "SuperAdmin"
     | 1337
    `;
    expect(JsonSchema(parser.parse(program))).toEqual([
      {
        $id: "https://example.com/#UserType",
        oneOf: [
          { const: "Admin" },
          { const: "User" },
          { const: "Editor" },
          { const: "SuperAdmin" },
          { const: 1337 },
        ],
      },
    ]);
  });

  it("Complex Union type", () => {
    const parser = new ApiParser();
    const program = `
    type Error
     | { message: String! } 
     | { code: 404 message: "testing" }
     | "Foo"
     | 42
    `;
    expect(JsonSchema(parser.parse(program))).toEqual([
      {
        $id: "https://example.com/#Error",
        oneOf: [
          {
            type: "object",
            properties: { message: { type: "string" } },
            required: ["message"],
          },
          {
            type: "object",
            properties: { code: { const: 404 }, message: { const: "testing" } },
            required: [],
          },
          { const: "Foo" },
          { const: 42 },
        ],
      },
    ]);
  });

  it("Api definition with type reference", () => {
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
    expect(JsonSchema(parser.parse(program))).toEqual([
      {
        $id: "https://example.com/#User",
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      {
        $id: "https://example.com/#Headers",
        type: "object",
        properties: { "x-header": { const: "yo" } },
        required: ["x-header"],
      },
      {
        $id: "https://example.com/#getUser_params",
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      {
        $id: "https://example.com/#getUser_headers",
        $ref: "https://example.com/#Headers",
      },
      {
        $id: "https://example.com/#getUser_200",
        type: "object",
        properties: {
          user: {
            $ref: "https://example.com/#User",
          },
        },
        required: ["user"],
      },
      {
        $id: "https://example.com/#getUser_400",
        $ref: "https://example.com/#User",
      },
    ]);
  });

  it("Complex Api definition with type reference, unions etc", () => {
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
    expect(JsonSchema(parser.parse(program))).toEqual([
      {
        $id: "https://example.com/#UserType",
        oneOf: [{ const: "Admin" }, { const: "User" }],
      },
      {
        $id: "https://example.com/#User",
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          userType: {
            type: "array",
            items: {
              oneOf: [
                { type: "null" },
                { $ref: "https://example.com/#UserType" },
              ],
            },
          },
        },
        required: ["id"],
      },
      {
        $id: "https://example.com/#getUser_params",
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      {
        $id: "https://example.com/#getUser_headers",
        type: "object",
        properties: { x: { type: "string" } },
        required: ["x"],
      },
      {
        $id: "https://example.com/#getUser_200",
        type: "object",
        properties: {
          user: {
            $ref: "https://example.com/#User",
          },
        },
        required: ["user"],
      },
      {
        $id: "https://example.com/#getUser_400",
        $ref: "https://example.com/#User",
      },
      {
        $id: "https://example.com/#getUser_404",
        type: "object",
        properties: {
          userType: {
            $ref: "https://example.com/#UserType",
          },
          user: {
            $ref: "https://example.com/#User",
          },
          nested: {
            type: "object",
            properties: {
              a: { type: "string" },
              b: { type: "number" },
            },
            required: ["a"],
          },
        },
        required: [],
      },
    ]);
  });
});
