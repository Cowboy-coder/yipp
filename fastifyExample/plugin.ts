import { FastifyPluginAsync } from "fastify";
import { addRoutes } from "./generated";

const plugin: FastifyPluginAsync = async (fastify, options) => {
  addRoutes(fastify, {
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
    getUser: ({ params, query }) => {
      console.log("params", params);
      console.log("query", query);
      return {
        code: 204,
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
    getUsers: (params) => {
      return {
        code: 200,
        body: [
          null,
          {
            id: "1",
            address: {
              name: "test",
            },
          },
          null,
          {
            id: "2",
            address: {
              name: "test2",
            },
          },
        ],
      };
    },
    postUser: (params) => {
      console.log(params);
      return {
        code: 200,
        body: {
          id: "foo",
          address: {
            name: "lol",
          },
        },
      };
    },
  });
};

export default plugin;
