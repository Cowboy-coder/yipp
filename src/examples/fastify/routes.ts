import { Context } from '.';
import { Api, User, UserType } from './generated';

const routes: Api<Context> = {
  health: () => ({ code: 200, body: { ok: 'ok' } }),
  login: ({ body: { username, password } }, { db }) => {
    if (db.login(username, password)) {
      return {
        code: 200,
        body: {
          token: 'secret',
        },
      };
    }
    return {
      code: 400,
      body: {
        message: 'bad username and password',
        fields: [
          {
            name: 'username',
            message: 'Bad username',
          },
          {
            name: 'password',
            message: 'Bad password',
          },
        ],
      },
    };
  },
  logout: () => ({ code: 204 }),
  getUser: (_, { db }) => {
    return {
      code: 200,
      body: db.findUsers(undefined)[1],
    };
  },
  getUsers: ({ query: { q }, headers }, { db }) => {
    if (headers.authorization === 'Bearer secret') {
      return {
        code: 200,
        body: db.findUsers(q),
      };
    }

    return {
      code: 400,
      body: {
        message: 'invalid token',
        fields: [],
      },
    };
  },
  postUser: ({ body, headers }) => {
    if (headers.authorization === 'Bearer secret') {
      const user: User = {
        id: 999,
        username: body.username,
        age: body.age,
        type: UserType.user,
        isCool: body.isCool,
        createdAt: new Date().toISOString(),
      };
      return {
        code: 200,
        body: user,
      };
    }

    return {
      code: 400,
      body: {
        message: 'invalid token',
        fields: [],
      },
    };
  },
  updateUser: ({ body, params, headers }, { db }) => {
    if (headers.authorization === 'Bearer secret') {
      const user = db.findUsers(undefined).find((u) => u.id === params.id);
      if (!user) {
        return {
          code: 404,
          body: {
            message: 'User not found',
            fields: [],
          },
        };
      }

      if (body.username !== undefined) {
        user.username = body.username;
      }
      if (body.age !== undefined) {
        user.age = body.age;
      }
      if (body.isCool !== undefined) {
        user.isCool = body.isCool;
      }
      if (body.createdAt !== undefined) {
        user.createdAt = body.createdAt;
      }

      return {
        code: 200,
        body: user,
      };
    }

    return {
      code: 400,
      body: {
        message: 'invalid token',
        fields: [],
      },
    };
  },
};

export default routes;
