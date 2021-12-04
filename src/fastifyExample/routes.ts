import { Context } from '.';
import { Api, User } from './generated';

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
        id: '1',
        username: body.username,
        age: body.age,
        type: 'user',
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

      if (body.username) {
        user.username = body.username;
      } else if (body.age) {
        user.age = body.age;
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
