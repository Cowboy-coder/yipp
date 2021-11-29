import Fastify from "fastify";
const fastify = Fastify({
  ajv: {
    customOptions: {
      removeAdditional: true,
      useDefaults: true,
      coerceTypes: "array",
      allErrors: true,
      nullable: true,
    },
    plugins: [],
  },
});
fastify.register(import("./plugin"));

fastify.listen(3000);
