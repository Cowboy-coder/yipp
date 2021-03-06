import { FastifyPluginAsync, FastifyRequest } from 'fastify';

export const JsonSchema = {
  $id: 'schema',
  type: 'object',
  definitions: {
    AuthenticatedRoute: {
      type: 'object',
      properties: {
        authorization: {
          type: 'string',
        },
      },
      required: ['authorization'],
    },
    Field: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        message: {
          type: 'string',
        },
      },
      required: ['name', 'message'],
    },
    Error: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
        },
        fields: {
          type: 'array',
          items: {
            $ref: '#/definitions/Field',
          },
        },
      },
      required: ['message', 'fields'],
    },
    FeedType: {
      enum: ['Video', 'Photo', 'Post'],
    },
    Video: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        videoUrl: {
          type: 'string',
        },
        type: {
          const: 'Video',
        },
      },
      required: ['id', 'videoUrl', 'type'],
    },
    Photo: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        photoUrl: {
          type: 'string',
        },
        type: {
          const: 'Photo',
        },
      },
      required: ['id', 'photoUrl', 'type'],
    },
    Post: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        postBody: {
          type: 'string',
        },
        type: {
          const: 'Post',
        },
      },
      required: ['id', 'postBody', 'type'],
    },
    Feed: {
      oneOf: [
        {
          $ref: '#/definitions/Video',
        },
        {
          $ref: '#/definitions/Photo',
        },
        {
          $ref: '#/definitions/Post',
        },
      ],
    },
    UserType: {
      enum: ['admin', 'user'],
    },
    User: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
        },
        username: {
          type: 'string',
        },
        age: {
          type: 'number',
        },
        type: {
          $ref: '#/definitions/UserType',
        },
        isCool: {
          type: 'boolean',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
        },
      },
      required: ['id', 'username', 'age', 'type', 'isCool', 'createdAt'],
    },
    login_body: {
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
    login_200: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
        },
      },
      required: ['token'],
    },
    login_400: {
      $ref: '#/definitions/Error',
    },
    logout_204: {
      type: 'null',
    },
    health_200: {
      type: 'object',
      properties: {
        ok: {
          const: 'ok',
        },
      },
      required: ['ok'],
    },
    getFeed_200: {
      type: 'array',
      items: {
        $ref: '#/definitions/Feed',
      },
    },
    Users_getUsers_query: {
      type: 'object',
      properties: {
        q: {
          type: 'string',
        },
      },
      required: [],
    },
    Users_getUsers_headers: {
      $ref: '#/definitions/AuthenticatedRoute',
    },
    Users_getUsers_200: {
      type: 'array',
      items: {
        $ref: '#/definitions/User',
      },
    },
    Users_getUsers_400: {
      $ref: '#/definitions/Error',
    },
    Users_getUser_params: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
        },
      },
      required: ['id'],
    },
    Users_getUser_200: {
      $ref: '#/definitions/User',
    },
    Users_getUser_400: {
      $ref: '#/definitions/Error',
    },
    Users_createUser_body: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
        },
        age: {
          type: 'number',
        },
        type: {
          $ref: '#/definitions/UserType',
        },
        isCool: {
          type: 'boolean',
        },
      },
      required: ['username', 'age', 'type', 'isCool'],
    },
    Users_createUser_headers: {
      $ref: '#/definitions/AuthenticatedRoute',
    },
    Users_createUser_200: {
      $ref: '#/definitions/User',
    },
    Users_createUser_400: {
      $ref: '#/definitions/Error',
    },
    Users_updateUser_params: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
        },
      },
      required: ['id'],
    },
    Users_updateUser_body: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
        },
        age: {
          type: 'number',
        },
        isCool: {
          type: 'boolean',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
        },
      },
      required: [],
    },
    Users_updateUser_headers: {
      $ref: '#/definitions/AuthenticatedRoute',
    },
    Users_updateUser_200: {
      $ref: '#/definitions/User',
    },
    Users_updateUser_400: {
      $ref: '#/definitions/Error',
    },
    Users_updateUser_404: {
      $ref: '#/definitions/Error',
    },
  },
};

type MaybePromise<T> = Promise<T> | T;

export type AuthenticatedRoute = {
  authorization: string;
};
export type Field = {
  name: string;
  message: string;
};
export type Error = {
  message: string;
  fields: Field[];
};
export enum FeedType {
  Video = 'Video',
  Photo = 'Photo',
  Post = 'Post',
}
export type Video = {
  id: string;
  videoUrl: string;
  type: 'Video';
};
export type Photo = {
  id: string;
  photoUrl: string;
  type: 'Photo';
};
export type Post = {
  id: string;
  postBody: string;
  type: 'Post';
};
export type Feed = Video | Photo | Post;
export enum UserType {
  admin = 'admin',
  user = 'user',
}
/**
 * Useful user documentation...
 */
export type User = {
  id: number;
  username: string;
  age: number;
  type: UserType;
  isCool: boolean;
  createdAt: string;
};

export type Api<T = any> = {
  login: (
    req: {
      body: {
        username: string;
        password: string;
      };
    },
    context: T,
  ) => MaybePromise<
    | {
        code: 200;
        body: {
          token: string;
        };
      }
    | {
        code: 400;
        body: Error;
      }
  >;

  logout: (
    req: Record<string, unknown>,
    context: T,
  ) => MaybePromise<{
    code: 204;
  }>;

  health: (
    req: Record<string, unknown>,
    context: T,
  ) => MaybePromise<{
    code: 200;
    body: {
      ok: 'ok';
    };
  }>;

  getFeed: (
    req: Record<string, unknown>,
    context: T,
  ) => MaybePromise<{
    code: 200;
    body: Feed[];
  }>;

  /**
   * User apis
   */
  Users: {
    /**
     * Get all users
     */
    getUsers: (
      req: {
        /**
         * Optional filters
         */
        query: {
          /**
           * Free text search
           */
          q?: string;
        };
        headers: AuthenticatedRoute;
      },
      context: T,
    ) => MaybePromise<
      | {
          code: 200;
          /**
           * An array of users
           */
          body: User[];
        }
      | {
          code: 400;
          body: Error;
        }
    >;

    getUser: (
      req: {
        params: {
          id: number;
        };
      },
      context: T,
    ) => MaybePromise<
      | {
          code: 200;
          body: User;
        }
      | {
          code: 400;
          body: Error;
        }
    >;

    createUser: (
      req: {
        body: {
          username: string;
          age: number;
          type: UserType;
          isCool: boolean;
        };
        headers: AuthenticatedRoute;
      },
      context: T,
    ) => MaybePromise<
      | {
          code: 200;
          body: User;
        }
      | {
          code: 400;
          body: Error;
        }
    >;

    /**
     * Update user takes user-fields
     * as input and returns the updated user
     */
    updateUser: (
      req: {
        params: {
          id: number;
        };
        body: {
          username?: string;
          age?: number;
          isCool?: boolean;
          createdAt?: string;
        };
        /**
         * Authenticated route. Must pass correct JWT.
         */
        headers: AuthenticatedRoute;
      },
      context: T,
    ) => MaybePromise<
      | {
          code: 200;
          /**
           * The updated user
           */
          body: User;
        }
      | {
          code: 400;
          body: Error;
        }
      | {
          code: 404;
          body: Error;
        }
    >;
  };
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
  fastify.addSchema(JsonSchema);

  fastify.post<{
    Body: {
      username: string;
      password: string;
    };
  }>(
    '/login',
    {
      schema: {
        body: { $ref: 'schema#/definitions/login_body' },
        response: {
          '200': { $ref: 'schema#/definitions/login_200' },
          '400': { $ref: 'schema#/definitions/login_400' },
        },
      },
    },
    async (req, reply) => {
      const response = await options.routes.login(
        {
          body: req.body,
        },
        (req as any).restplugin_context,
      );

      reply.code(response.code);

      if ('body' in response && response.body) {
        reply.send(response.body);
      }
    },
  );

  fastify.post(
    '/logout',
    {
      schema: {
        response: { '204': { $ref: 'schema#/definitions/logout_204' } },
      },
    },
    async (req, reply) => {
      const response = await options.routes.logout({}, (req as any).restplugin_context);

      reply.code(response.code);
    },
  );

  fastify.get(
    '/health',
    {
      schema: {
        response: { '200': { $ref: 'schema#/definitions/health_200' } },
      },
    },
    async (req, reply) => {
      const response = await options.routes.health({}, (req as any).restplugin_context);

      reply.code(response.code);

      if ('body' in response && response.body) {
        reply.send(response.body);
      }
    },
  );

  fastify.get(
    '/feed',
    {
      schema: {
        response: { '200': { $ref: 'schema#/definitions/getFeed_200' } },
      },
    },
    async (req, reply) => {
      const response = await options.routes.getFeed({}, (req as any).restplugin_context);

      reply.code(response.code);

      if ('body' in response && response.body) {
        reply.send(response.body);
      }
    },
  );

  fastify.get<{
    Querystring: {
      /**
       * Free text search
       */
      q?: string;
    };
    Headers: AuthenticatedRoute;
  }>(
    '/users',
    {
      schema: {
        querystring: { $ref: 'schema#/definitions/Users_getUsers_query' },
        headers: { $ref: 'schema#/definitions/Users_getUsers_headers' },
        response: {
          '200': { $ref: 'schema#/definitions/Users_getUsers_200' },
          '400': { $ref: 'schema#/definitions/Users_getUsers_400' },
        },
      },
    },
    async (req, reply) => {
      const response = await options.routes.Users.getUsers(
        {
          query: req.query,
          headers: req.headers,
        },
        (req as any).restplugin_context,
      );

      reply.code(response.code);

      if ('body' in response && response.body) {
        reply.send(response.body);
      }
    },
  );

  fastify.get<{
    Params: {
      id: number;
    };
  }>(
    '/users/:id',
    {
      schema: {
        params: { $ref: 'schema#/definitions/Users_getUser_params' },
        response: {
          '200': { $ref: 'schema#/definitions/Users_getUser_200' },
          '400': { $ref: 'schema#/definitions/Users_getUser_400' },
        },
      },
    },
    async (req, reply) => {
      const response = await options.routes.Users.getUser(
        {
          params: req.params,
        },
        (req as any).restplugin_context,
      );

      reply.code(response.code);

      if ('body' in response && response.body) {
        reply.send(response.body);
      }
    },
  );

  fastify.post<{
    Body: {
      username: string;
      age: number;
      type: UserType;
      isCool: boolean;
    };
    Headers: AuthenticatedRoute;
  }>(
    '/users',
    {
      schema: {
        headers: { $ref: 'schema#/definitions/Users_createUser_headers' },
        body: { $ref: 'schema#/definitions/Users_createUser_body' },
        response: {
          '200': { $ref: 'schema#/definitions/Users_createUser_200' },
          '400': { $ref: 'schema#/definitions/Users_createUser_400' },
        },
      },
    },
    async (req, reply) => {
      const response = await options.routes.Users.createUser(
        {
          body: req.body,
          headers: req.headers,
        },
        (req as any).restplugin_context,
      );

      reply.code(response.code);

      if ('body' in response && response.body) {
        reply.send(response.body);
      }
    },
  );

  fastify.patch<{
    Params: {
      id: number;
    };
    Body: {
      username?: string;
      age?: number;
      isCool?: boolean;
      createdAt?: string;
    };
    Headers: AuthenticatedRoute;
  }>(
    '/users/:id',
    {
      schema: {
        params: { $ref: 'schema#/definitions/Users_updateUser_params' },
        headers: { $ref: 'schema#/definitions/Users_updateUser_headers' },
        body: { $ref: 'schema#/definitions/Users_updateUser_body' },
        response: {
          '200': { $ref: 'schema#/definitions/Users_updateUser_200' },
          '400': { $ref: 'schema#/definitions/Users_updateUser_400' },
          '404': { $ref: 'schema#/definitions/Users_updateUser_404' },
        },
      },
    },
    async (req, reply) => {
      const response = await options.routes.Users.updateUser(
        {
          params: req.params,
          body: req.body,
          headers: req.headers,
        },
        (req as any).restplugin_context,
      );

      reply.code(response.code);

      if ('body' in response && response.body) {
        reply.send(response.body);
      }
    },
  );
};
export default RestPlugin;
