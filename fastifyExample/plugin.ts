import { FastifyPluginAsync } from "fastify";
import { addRoutes } from "./generated";

const plugin: FastifyPluginAsync = async (fastify, options) => {
  addRoutes(fastify, {
    getUser: ({ params, query }) => {
      console.log("params", params);
      console.log("query", query);
      return {
        code: 200,
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
    getUsers: () => {
      return {
        code: 200,
        body: [
          {
            id: "1",
            address: {
              name: "test",
            },
          },
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
