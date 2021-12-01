import Fastify, { FastifyError } from "fastify";
import RestPlugin from "./generated";
import routes from "./routes";
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

export type Context = {
  url: string;
  db: {
    findUsers: () => (number | undefined)[];
  };
};

fastify.register(RestPlugin, {
  routes: routes,
  setContext: (req) => {
    const context: Context = {
      url: req.url,
      db: {
        findUsers: () => [1, 2, 3, undefined, 4, 5],
      },
    };
    return context;
  },
});
fastify.setErrorHandler<FastifyError>((err, _, reply) => {
  const validationContext = (err as any).validationContext;
  const validations = err.validation ?? [];
  reply
    .send({
      message: err.message,
      statusCode: reply.statusCode,
      errors: validations.map((validation) => {
        let field = validation.dataPath;
        const missingProperty = validation.params["missingProperty"];
        if (!field && missingProperty) {
          field = `.${
            Array.isArray(missingProperty)
              ? missingProperty[0]
              : missingProperty
          }`;
        }
        return {
          field,
          message: validation.message,
          context: validationContext,
        };
      }),
    })
    .code(reply.statusCode);
});

fastify.listen(3000);
