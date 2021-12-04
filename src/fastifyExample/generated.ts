import { FastifyPluginAsync, FastifyRequest } from 'fastify';

export const JsonSchema = [
  {
    $id: 'https://example.com/#AuthenticatedRoute',
    type: 'object',
    properties: {
      authorization: {
        type: 'string',
      },
    },
    required: ['authorization'],
  },
  {
    $id: 'https://example.com/#Field',
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      message: {
        type: 'string',
      },
    },
    required: ['name'],
  },
  {
    $id: 'https://example.com/#Error',
    type: 'object',
    properties: {
      message: {
        type: 'string',
      },
      fields: {
        type: 'array',
        items: {
          $ref: 'https://example.com/#Field',
        },
      },
    },
    required: ['message', 'fields'],
  },
  {
    $id: 'https://example.com/#UserType',
    oneOf: [
      {
        const: 'admin',
      },
      {
        const: 'user',
      },
    ],
  },
  {
    $id: 'https://example.com/#User',
    type: 'object',
    properties: {
      id: {
        type: 'string',
      },
      username: {
        type: 'string',
      },
      age: {
        type: 'number',
      },
      type: {
        $ref: 'https://example.com/#UserType',
      },
    },
    required: ['id', 'username', 'age', 'type'],
  },
  {
    $id: 'https://example.com/#health_200',
    type: 'object',
    properties: {
      ok: {
        const: 'ok',
      },
    },
    required: ['ok'],
  },
  {
    $id: 'https://example.com/#login_body',
    type: 'object',
    properties: {
      username: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
    },
    required: ['username', 'password'],
  },
  {
    $id: 'https://example.com/#login_200',
    type: 'object',
    properties: {
      token: {
        type: 'string',
      },
    },
    required: ['token'],
  },
  {
    $id: 'https://example.com/#login_400',
    $ref: 'https://example.com/#Error',
  },
  {
    $id: 'https://example.com/#logout_204',
    type: 'null',
  },
  {
    $id: 'https://example.com/#getUsers_query',
    type: 'object',
    properties: {
      q: {
        type: 'string',
      },
    },
    required: [],
  },
  {
    $id: 'https://example.com/#getUsers_headers',
    $ref: 'https://example.com/#AuthenticatedRoute',
  },
  {
    $id: 'https://example.com/#getUsers_200',
    type: 'array',
    items: {
      $ref: 'https://example.com/#User',
    },
  },
  {
    $id: 'https://example.com/#getUsers_400',
    $ref: 'https://example.com/#Error',
  },
  {
    $id: 'https://example.com/#postUser_body',
    type: 'object',
    properties: {
      username: {
        type: 'string',
      },
      age: {
        type: 'number',
      },
      type: {
        $ref: 'https://example.com/#UserType',
      },
    },
    required: ['username', 'age', 'type'],
  },
  {
    $id: 'https://example.com/#postUser_headers',
    $ref: 'https://example.com/#AuthenticatedRoute',
  },
  {
    $id: 'https://example.com/#postUser_200',
    $ref: 'https://example.com/#User',
  },
  {
    $id: 'https://example.com/#postUser_400',
    $ref: 'https://example.com/#Error',
  },
  {
    $id: 'https://example.com/#updateUser_params',
    type: 'object',
    properties: {
      id: {
        type: 'string',
      },
    },
    required: ['id'],
  },
  {
    $id: 'https://example.com/#updateUser_body',
    type: 'object',
    properties: {
      username: {
        type: 'string',
      },
      age: {
        type: 'number',
      },
    },
    required: [],
  },
  {
    $id: 'https://example.com/#updateUser_headers',
    $ref: 'https://example.com/#AuthenticatedRoute',
  },
  {
    $id: 'https://example.com/#updateUser_200',
    $ref: 'https://example.com/#User',
  },
  {
    $id: 'https://example.com/#updateUser_400',
    $ref: 'https://example.com/#Error',
  },
  {
    $id: 'https://example.com/#updateUser_404',
    $ref: 'https://example.com/#Error',
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
export type UserType = 'admin' | 'user';
export type User = {
  id: string;
  username: string;
  age: number;
  type: UserType;
};
export type Api<T = any> = {
  health: (
    req: {},
    context: T,
  ) => MaybePromise<{
    code: 200;
    body: {
      ok: 'ok';
    };
  }>;

  login: (
    req: {
      body: {
        username: string;
        password: string;
      };
    },
    context: T,
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

  logout: (
    req: {},
    context: T,
  ) => MaybePromise<{
    code: 204;
  }>;

  getUsers: (
    req: {
      query: {
        q?: string;
      };
      headers: AuthenticatedRoute;
    },
    context: T,
  ) =>
    | MaybePromise<{
        code: 200;
        body: User[];
      }>
    | MaybePromise<{
        code: 400;
        body: Error;
      }>;

  postUser: (
    req: {
      body: {
        username: string;
        age: number;
        type: UserType;
      };
      headers: AuthenticatedRoute;
    },
    context: T,
  ) =>
    | MaybePromise<{
        code: 200;
        body: User;
      }>
    | MaybePromise<{
        code: 400;
        body: Error;
      }>;

  updateUser: (
    req: {
      params: {
        id: string;
      };
      body: {
        username?: string;
        age?: number;
      };
      headers: AuthenticatedRoute;
    },
    context: T,
  ) =>
    | MaybePromise<{
        code: 200;
        body: User;
      }>
    | MaybePromise<{
        code: 400;
        body: Error;
      }>
    | MaybePromise<{
        code: 404;
        body: Error;
      }>;
};
const RestPlugin: FastifyPluginAsync<{ routes: Api; setContext: (req: FastifyRequest) => any }> = async (
  fastify,
  options,
) => {
  fastify.decorateRequest('restplugin_context', null);

  fastify.addHook('preHandler', (req, _, done) => {
    (req as any).restplugin_context = options.setContext(req);
    done();
  });
  JsonSchema.forEach((schema) => fastify.addSchema(schema));

  fastify.get<{}>(
    '/health',
    {
      schema: {
        response: { '200': { $ref: 'https://example.com/#health_200' } },
      },
    },
    async (req, reply) => {
      const response = await options.routes.health({}, (req as any).restplugin_context);

      if ('headers' in response && (response as any).headers) {
        reply.headers((response as any).headers);
      }

      reply.code(response.code);
      if ('body' in response && (response as any).body) {
        reply.send((response as any).body);
      }
    },
  );

  fastify.post<{
    Body: {
      username: string;
      password: string;
    };
  }>(
    '/login',
    {
      schema: {
        body: { $ref: 'https://example.com/#login_body' },
        response: {
          '200': { $ref: 'https://example.com/#login_200' },
          '400': { $ref: 'https://example.com/#login_400' },
        },
      },
    },
    async (req, reply) => {
      const response = await options.routes.login(
        {
          body: { ...req.body },
        },
        (req as any).restplugin_context,
      );

      if ('headers' in response && (response as any).headers) {
        reply.headers((response as any).headers);
      }

      reply.code(response.code);
      if ('body' in response && (response as any).body) {
        reply.send((response as any).body);
      }
    },
  );

  fastify.post<{}>(
    '/logout',
    {
      schema: {
        response: { '204': { $ref: 'https://example.com/#logout_204' } },
      },
    },
    async (req, reply) => {
      const response = await options.routes.logout({}, (req as any).restplugin_context);

      if ('headers' in response && (response as any).headers) {
        reply.headers((response as any).headers);
      }

      reply.code(response.code);
      if ('body' in response && (response as any).body) {
        reply.send((response as any).body);
      }
    },
  );

  fastify.get<{
    Querystring: {
      q?: string;
    };
    Headers: AuthenticatedRoute;
  }>(
    '/users',
    {
      schema: {
        querystring: { $ref: 'https://example.com/#getUsers_query' },
        headers: { $ref: 'https://example.com/#getUsers_headers' },
        response: {
          '200': { $ref: 'https://example.com/#getUsers_200' },
          '400': { $ref: 'https://example.com/#getUsers_400' },
        },
      },
    },
    async (req, reply) => {
      const response = await options.routes.getUsers(
        {
          query: { ...req.query },
          headers: { ...req.headers },
        },
        (req as any).restplugin_context,
      );

      if ('headers' in response && (response as any).headers) {
        reply.headers((response as any).headers);
      }

      reply.code(response.code);
      if ('body' in response && (response as any).body) {
        reply.send((response as any).body);
      }
    },
  );

  fastify.post<{
    Body: {
      username: string;
      age: number;
      type: UserType;
    };
    Headers: AuthenticatedRoute;
  }>(
    '/users',
    {
      schema: {
        headers: { $ref: 'https://example.com/#postUser_headers' },
        body: { $ref: 'https://example.com/#postUser_body' },
        response: {
          '200': { $ref: 'https://example.com/#postUser_200' },
          '400': { $ref: 'https://example.com/#postUser_400' },
        },
      },
    },
    async (req, reply) => {
      const response = await options.routes.postUser(
        {
          body: { ...req.body },
          headers: { ...req.headers },
        },
        (req as any).restplugin_context,
      );

      if ('headers' in response && (response as any).headers) {
        reply.headers((response as any).headers);
      }

      reply.code(response.code);
      if ('body' in response && (response as any).body) {
        reply.send((response as any).body);
      }
    },
  );

  fastify.patch<{
    Params: {
      id: string;
    };
    Body: {
      username?: string;
      age?: number;
    };
    Headers: AuthenticatedRoute;
  }>(
    '/users/:id',
    {
      schema: {
        params: { $ref: 'https://example.com/#updateUser_params' },
        headers: { $ref: 'https://example.com/#updateUser_headers' },
        body: { $ref: 'https://example.com/#updateUser_body' },
        response: {
          '200': { $ref: 'https://example.com/#updateUser_200' },
          '400': { $ref: 'https://example.com/#updateUser_400' },
          '404': { $ref: 'https://example.com/#updateUser_404' },
        },
      },
    },
    async (req, reply) => {
      const response = await options.routes.updateUser(
        {
          params: { ...req.params },
          body: { ...req.body },
          headers: { ...req.headers },
        },
        (req as any).restplugin_context,
      );

      if ('headers' in response && (response as any).headers) {
        reply.headers((response as any).headers);
      }

      reply.code(response.code);
      if ('body' in response && (response as any).body) {
        reply.send((response as any).body);
      }
    },
  );
};
export default RestPlugin;
