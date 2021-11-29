import { FastifyInstance } from "fastify";

export type User = {
  id: string;
  address?: {
    name?: string;
  };
};

export type Query = {
  id: string;
  filter: string;
};

export type Error =
  | {
      message: string;
    }
  | {
      code?: 404;
      message?: "testing";
    }
  | "Foo"
  | 42;

export type Api = {
  getUser: (req: {
    params: {
      id: string[];
    };
    query: Query;
    body: {
      user: User;
    };
  }) =>
    | {
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
      }
    | {
        code: 404;
        body: Error;
      };

  postUser: (req: {
    body: {
      user: User;
    };
  }) =>
    | {
        code: 200;
        body: User;
      }
    | {
        code: 404;
        body: Error;
      };
};
export const addRoutes = (fastify: FastifyInstance, routes: Api) => {
  fastify.get<{
    Params: {
      id: string[];
    };
    Querystring: Query;
    Body: {
      user: User;
    };
  }>("/users/:id", (req, reply) => {
    const response = routes.getUser({
      params: req.params,
      query: req.query,
      body: req.body,
    });
    reply.code(response.code).send(response.body);
  });

  fastify.post<{
    Body: {
      user: User;
    };
  }>("/users", (req, reply) => {
    const response = routes.postUser({
      body: req.body,
    });
    reply.code(response.code).send(response.body);
  });
};
