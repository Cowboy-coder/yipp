import { Context } from '.';
import { Api } from './generated';

const routes: Api<Context> = {
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
};

export default routes;
