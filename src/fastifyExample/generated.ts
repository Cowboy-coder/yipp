import { FastifyPluginAsync, FastifyRequest } from "fastify";

export const JsonSchema = [
  {
    $id: "https://example.com/#AuthenticatedRoute",
    type: "object",
    properties: {
      authorization: {
        type: "string",
      },
    },
    required: ["authorization"],
  },
  {
    $id: "https://example.com/#Field",
    type: "object",
    properties: {
      name: {
        type: "string",
      },
      message: {
        type: "string",
      },
    },
    required: ["name"],
  },
  {
    $id: "https://example.com/#Error",
    type: "object",
    properties: {
      message: {
        type: "string",
      },
      fields: {
        type: "array",
        items: {
          $ref: "https://example.com/#Field",
        },
      },
    },
    required: ["message", "fields"],
  },
  {
    $id: "https://example.com/#User",
    type: "object",
    properties: {
      id: {
        type: "string",
      },
      username: {
        type: "string",
      },
      age: {
        type: "number",
      },
      type: {
        oneOf: [
          {
            const: "admin",
          },
          {
            const: "user",
          },
        ],
      },
    },
    required: ["id", "username", "age", "type"],
  },
  {
    $id: "https://example.com/#login_body",
    type: "object",
    properties: {
      username: {
        type: "string",
      },
      password: {
        type: "string",
      },
    },
    required: ["username", "password"],
  },
  {
    $id: "https://example.com/#login_200",
    type: "object",
    properties: {
      token: {
        type: "string",
      },
    },
    required: ["token"],
  },
  {
    $id: "https://example.com/#login_400",
    $ref: "https://example.com/#Error",
  },
  {
    $id: "https://example.com/#getUsers_query",
    type: "object",
    properties: {
      q: {
        type: "string",
      },
    },
    required: [],
  },
  {
    $id: "https://example.com/#getUsers_headers",
    $ref: "https://example.com/#AuthenticatedRoute",
  },
  {
    $id: "https://example.com/#getUsers_200",
    type: "array",
    items: {
      $ref: "https://example.com/#User",
    },
  },
  {
    $id: "https://example.com/#getUsers_400",
    $ref: "https://example.com/#Error",
  },
];

type MaybePromise<T> = Promise<T> | T;

export type AuthenticatedRoute = {
  authorization: string;
};
export type Field = {
  name: string;
  message?: string;
};
export type Error = {
  message: string;
  fields: Field[];
};
export type User = {
  id: string;
  username: string;
  age: number;
  type: "admin" | "user";
};
export type Api<T = any> = {
  login: (
    req: {
      body: {
        username: string;
        password: string;
      };
    },
    context: T
  ) =>
    | MaybePromise<{
        code: 200;
        body: {
          token: string;
        };
      }>
    | MaybePromise<{
        code: 400;
        body: Error;
      }>;

  getUsers: (
    req: {
      query: {
        q?: string;
      };
      headers: AuthenticatedRoute;
    },
    context: T
  ) =>
    | MaybePromise<{
        code: 200;
        body: User[];
      }>
    | MaybePromise<{
        code: 400;
        body: Error;
      }>;
};
const RestPlugin: FastifyPluginAsync<{
  routes: Api;
  setContext: (req: FastifyRequest) => any;
}> = async (fastify, options) => {
  fastify.decorateRequest("restplugin_context", null);

  fastify.addHook("preHandler", (req, _, done) => {
    (req as any).restplugin_context = options.setContext(req);
    done();
  });
  JsonSchema.forEach((schema) => fastify.addSchema(schema));

  fastify.post<{
    Body: {
      username: string;
      password: string;
    };
  }>(
    "/login",
    {
      schema: {
        body: { $ref: "https://example.com/#login_body" },
        response: {
          "200": { $ref: "https://example.com/#login_200" },
          "400": { $ref: "https://example.com/#login_400" },
        },
      },
    },
    async (req, reply) => {
      const response = await options.routes.login(
        {
          body: { ...req.body },
        },
        (req as any).restplugin_context
      );

      if ("headers" in response && (response as any).headers) {
        reply.headers((response as any).headers);
      }

      reply.code(response.code);
      if ("body" in response && (response as any).body) {
        reply.send(response.body);
      }
    }
  );

  fastify.get<{
    Querystring: {
      q?: string;
    };
    Headers: AuthenticatedRoute;
  }>(
    "/users",
    {
      schema: {
        querystring: { $ref: "https://example.com/#getUsers_query" },
        headers: { $ref: "https://example.com/#getUsers_headers" },
        response: {
          "200": { $ref: "https://example.com/#getUsers_200" },
          "400": { $ref: "https://example.com/#getUsers_400" },
        },
      },
    },
    async (req, reply) => {
      const response = await options.routes.getUsers(
        {
          query: { ...req.query },
          headers: { ...req.headers },
        },
        (req as any).restplugin_context
      );

      if ("headers" in response && (response as any).headers) {
        reply.headers((response as any).headers);
      }

      reply.code(response.code);
      if ("body" in response && (response as any).body) {
        reply.send(response.body);
      }
    }
  );
};
export default RestPlugin;
