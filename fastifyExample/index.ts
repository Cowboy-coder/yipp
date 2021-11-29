import Fastify, { FastifyError } from "fastify";
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
