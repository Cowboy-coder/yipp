import { Context } from ".";
import { Api } from "./generated";

const routes: Api<Context> = {
  login: ({ body: { username, password } }) => {
    return Math.random() > 0.5
      ? {
          code: 200,
          body: {
            token: "newtoken yo",
          },
        }
      : {
          code: 400,
          body: {
            message: "damn",
            fields: {
              username,
              password,
            },
          },
        };
  },
  getUsers: (req, { db }) => {
    return {
      code: 200,
      body: db.findUsers().map((id) =>
        id
          ? {
              id: id.toString(),
            }
          : null
      ),
    };
  },
  getUser: ({ params }) => {
    console.log("params", params);
    return {
      code: 200,
      headers: {
        authorization: "something",
      },
      body: {
        id: "foo",
        address: {
          city: "stockholm",
          street: "foo",
          country: "UK",
        },
      },
    };
  },
  postUser: (params) => {
    console.log(params);
    return {
      code: 200,
      body: {
        id: "foo",
        address: {
          street: "lol",
        },
      },
    };
  },
};

export default routes;
