import Fastify, { FastifyError } from 'fastify';
import RestPlugin from './generated';
import routes from './routes';
const fastify = Fastify({
  ajv: {
    customOptions: {
      removeAdditional: true,
      useDefaults: true,
      coerceTypes: 'array',
      allErrors: true,
      nullable: true,
    },
    plugins: [],
  },
});
const db = {
  findUsers: (query: string | undefined) => {
    return Array.from({ length: 20 }, (value, key) => key)
      .map((_, ix) => ({
        id: ix.toString(),
        username: `username_${ix}`,
        type: ix % 4 === 0 ? ('admin' as const) : ('user' as const),
        age: ix + 1,
      }))
      .filter((x) => x.username.indexOf(query ?? '') > -1);
  },
  login: (username: string, password: string) => username === 'admin' && password === 'password',
};

export type Context = {
  url: string;
  db: typeof db;
};

fastify.register(RestPlugin, {
  routes: routes,
  setContext: (req) => {
    const context: Context = {
      url: req.url,
      db,
    };
    return context;
  },
});

fastify.setErrorHandler<FastifyError>((err, _, reply) => {
  const validations = err.validation ?? [];
  reply
    .send({
      message: err.message,
      fields: validations.map((validation) => {
        let field = validation.dataPath;
        const missingProperty = validation.params['missingProperty'];
        if (!field && missingProperty) {
          field = `.${Array.isArray(missingProperty) ? missingProperty[0] : missingProperty}`;
        }
        return {
          field,
          message: validation.message,
        };
      }),
    })
    .code(reply.statusCode);
});

fastify.listen(3000);
