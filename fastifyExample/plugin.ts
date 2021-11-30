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
    getUsers: (params) => {
      return {
        code: 200,
        body: [
          null,
          {
            id: "1",
            address: {
              street: "test",
            },
          },
          null,
          {
            id: "2",
            address: {
              street: "test2",
            },
          },
        ],
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
  });
};

export default plugin;
