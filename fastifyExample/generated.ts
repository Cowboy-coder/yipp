import { FastifyInstance } from "fastify";

export const JsonSchema = [
  {
    $id: "https://example.com/#User",
    type: "object",
    properties: {
      id: {
        type: "string",
      },
      address: {
        type: "object",
        properties: {
          street: {
            type: "string",
          },
        },
        required: [],
      },
    },
    required: ["id"],
  },
  {
    $id: "https://example.com/#Query",
    type: "object",
    properties: {
      filter: {
        oneOf: [
          {
            const: "id",
          },
          {
            const: "address",
          },
        ],
      },
    },
    required: [],
  },
  {
    $id: "https://example.com/#FieldError",
    type: "object",
    properties: {
      field: {
        type: "string",
      },
      message: {
        type: "string",
      },
    },
    required: ["field", "message"],
  },
  {
    $id: "https://example.com/#Error",
    oneOf: [
      {
        type: "object",
        properties: {
          message: {
            type: "string",
          },
        },
        required: ["message"],
      },
      {
        type: "object",
        properties: {
          message: {
            type: "string",
          },
          fields: {
            type: "array",
            items: {
              $ref: "https://example.com/#FieldError",
            },
          },
        },
        required: ["message", "fields"],
      },
    ],
  },
  {
    $id: "https://example.com/#AuthorizationHeader",
    type: "object",
    properties: {
      authorization: {
        type: "string",
      },
    },
    required: ["authorization"],
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
    required: [],
  },
  {
    $id: "https://example.com/#login_400",
    $ref: "https://example.com/#Error",
  },
  {
    $id: "https://example.com/#getUsers_headers",
    $ref: "https://example.com/#AuthorizationHeader",
  },
  {
    $id: "https://example.com/#getUsers_200",
    type: "array",
    items: {
      oneOf: [
        {
          type: "null",
        },
        {
          $ref: "https://example.com/#User",
        },
      ],
    },
  },
  {
    $id: "https://example.com/#getUser_params",
    type: "object",
    properties: {
      id: {
        type: "array",
        items: {
          type: "number",
        },
      },
    },
    required: ["id"],
  },
  {
    $id: "https://example.com/#getUser_query",
    $ref: "https://example.com/#Query",
  },
  {
    $id: "https://example.com/#getUser_200",
    type: "object",
    properties: {
      id: {
        type: "string",
      },
      name: {
        type: "string",
      },
      address: {
        type: "object",
        properties: {
          city: {
            type: "string",
          },
          street: {
            type: "string",
          },
          country: {
            oneOf: [
              {
                const: "Sweden",
              },
              {
                const: "UK",
              },
            ],
          },
        },
        required: ["city", "street", "country"],
      },
    },
    required: ["id"],
  },
  {
    $id: "https://example.com/#getUser_204",
    type: "null",
  },
  {
    $id: "https://example.com/#getUser_404",
    $ref: "https://example.com/#Error",
  },
  {
    $id: "https://example.com/#postUser_body",
    type: "object",
    properties: {
      user: {
        $ref: "https://example.com/#User",
      },
    },
    required: ["user"],
  },
  {
    $id: "https://example.com/#postUser_200",
    $ref: "https://example.com/#User",
  },
  {
    $id: "https://example.com/#postUser_404",
    $ref: "https://example.com/#Error",
  },
];

type MaybePromise<T> = Promise<T> | T;

export type User = {
  id: string;
  address?: {
    street?: string;
  };
};
export type Query = {
  filter?: "id" | "address";
};
export type FieldError = {
  field: string;
  message: string;
};
export type Error =
  | {
      message: string;
    }
  | {
      message: string;
      fields: FieldError[];
    };
export type AuthorizationHeader = {
  authorization: string;
};
export type Api = {
  login: (req: {
    body: {
      username: string;
      password: string;
    };
  }) =>
    | MaybePromise<{
        code: 200;
        body: {
          token?: string;
        };
      }>
    | MaybePromise<{
        code: 400;
        body: Error;
      }>;

  getUsers: (req: { headers: AuthorizationHeader }) => MaybePromise<{
    code: 200;
    body: (User | null)[];
  }>;

  getUser: (req: {
    params: {
      id: number[];
    };
    query: Query;
  }) =>
    | MaybePromise<{
        code: 200;
        body: {
          id: string;
          name?: string;
          address?: {
            city: string;
            street: string;
            country: "Sweden" | "UK";
          };
        };
        headers: {
          authorization: string;
        };
      }>
    | MaybePromise<{
        code: 204;
      }>
    | MaybePromise<{
        code: 404;
        body: Error;
      }>;

  postUser: (req: {
    body: {
      user: User;
    };
  }) =>
    | MaybePromise<{
        code: 200;
        body: User;
      }>
    | MaybePromise<{
        code: 404;
        body: Error;
      }>;
};
export const addRoutes = (fastify: FastifyInstance, routes: Api) => {
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
      const response = await routes.login({
        body: { ...req.body },
      });

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
    Headers: AuthorizationHeader;
  }>(
    "/users",
    {
      schema: {
        headers: { $ref: "https://example.com/#getUsers_headers" },
        response: { "200": { $ref: "https://example.com/#getUsers_200" } },
      },
    },
    async (req, reply) => {
      const response = await routes.getUsers({
        headers: { ...req.headers },
      });

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
    Params: {
      id: number[];
    };
    Querystring: Query;
  }>(
    "/users/:id",
    {
      schema: {
        params: { $ref: "https://example.com/#getUser_params" },
        querystring: { $ref: "https://example.com/#getUser_query" },
        response: {
          "200": { $ref: "https://example.com/#getUser_200" },
          "204": { $ref: "https://example.com/#getUser_204" },
          "404": { $ref: "https://example.com/#getUser_404" },
        },
      },
    },
    async (req, reply) => {
      const response = await routes.getUser({
        params: { ...req.params },
        query: { ...req.query },
      });

      if ("headers" in response && (response as any).headers) {
        reply.headers((response as any).headers);
      }

      reply.code(response.code);
      if ("body" in response && (response as any).body) {
        reply.send(response.body);
      }
    }
  );

  fastify.post<{
    Body: {
      user: User;
    };
  }>(
    "/users",
    {
      schema: {
        body: { $ref: "https://example.com/#postUser_body" },
        response: {
          "200": { $ref: "https://example.com/#postUser_200" },
          "404": { $ref: "https://example.com/#postUser_404" },
        },
      },
    },
    async (req, reply) => {
      const response = await routes.postUser({
        body: { ...req.body },
      });

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
