import { FastifyPluginAsync } from "fastify";
import { addRoutes } from "./generated";

const plugin: FastifyPluginAsync = async (fastify, options) => {
  addRoutes(fastify, {
    getUser: ({ params, query, body }) => {
      console.log("params", params);
      console.log("query", query);
      console.log("body", body);
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
