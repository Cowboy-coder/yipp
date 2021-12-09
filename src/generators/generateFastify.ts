import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import { ApiDefinition, Ast } from '../ApiParser';
import { getApiDefinitions, getDeclarations } from '../AstQuery';
import JsonSchema from '../JsonSchema';
import { generateApiField, generateDeclarations } from './commonTs';

const prettierConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')).prettier;

const apiDefinition = (d: ApiDefinition) => {
  const req = (['params', 'query', 'body', 'headers'] as const)
    .map((t) => {
      const x = d[t];
      if (x === undefined) {
        return '';
      }
      return `${t}: ${generateApiField(x)}`;
    })
    .filter((x) => !!x)
    .join(',\n');
  return `
  ${d.name}: (
    req: ${req ? `{${req}}` : 'Record<string,unknown>'} , context: T) => MaybePromise< ${d.responses
    .map(({ body, headers, status }) => {
      return `{
    code: ${status};
    ${[body ? `body: ${generateApiField(body)}` : '', headers ? `headers: ${generateApiField(headers)}` : '']
      .filter((x) => !!x)
      .join(';\n')}
  }`;
    })
    .join(' | ')}
  >`;
};

const fastify = (d: ApiDefinition) => {
  const hasResponseHeaders = d.responses.map((x) => x.headers).filter((x) => !!x).length > 0;
  const hasResponseBody = d.responses.map((x) => x.body).filter((x) => !!x).length > 0;

  const generics = [
    d.params ? `Params: ${generateApiField(d.params)}` : '',
    d.query ? `Querystring: ${generateApiField(d.query)}` : '',
    d.body ? `Body: ${generateApiField(d.body)}` : '',
    d.headers ? `Headers: ${generateApiField(d.headers)}` : '',
  ]
    .filter((x) => !!x)
    .join(',');
  return `
  fastify.${d.method.toLowerCase()}${generics ? `<{${generics}}>` : ''}("${d.path}", {
    schema: {
    ${[
      d.params ? `params: { $ref: "schema#/definitions/${d.name}_params"}` : undefined,
      d.query ? `querystring: { $ref: "schema#/definitions/${d.name}_query"}` : undefined,
      d.headers ? `headers: { $ref: "schema#/definitions/${d.name}_headers"}` : undefined,
      d.body ? `body: { $ref: "schema#/definitions/${d.name}_body"}` : undefined,
      `response: {${d.responses
        .map((r) => `"${r.status}": {$ref: "schema#/definitions/${`${d.name}_${r.status}"}`}`)
        .filter((x) => !!x)
        .join(',')}}`,
    ]
      .filter((x) => !!x)
      .join(',')},
    }
  }, async (req, reply) => {
    const response = await options.routes.${d.name}({
    ${[
      d.params ? 'params: req.params' : '',
      d.query ? 'query: req.query' : '',
      d.body ? 'body: req.body' : '',
      d.headers ? 'headers: req.headers' : '',
    ]
      .filter((x) => !!x)
      .join(',')}
    }, (req as any).restplugin_context);

    ${
      hasResponseHeaders
        ? `
      if ("headers" in response && response.headers) {
        reply.headers(response.headers);
      }
    `
        : ''
    }

    reply.code(response.code)
    ${
      hasResponseBody
        ? `
      if ("body" in response && response.body) {
        reply.send(response.body)
      }
    `
        : ''
    }
  })
  `;
};

const generateFastify = (ast: Ast) => {
  return prettier.format(
    `
    import { FastifyPluginAsync, FastifyRequest } from "fastify";

    export const JsonSchema = ${JSON.stringify(JsonSchema(ast), null, 2)};

    type MaybePromise<T> = Promise<T> | T;

    ${generateDeclarations(getDeclarations(ast))}

    export type Api<T = any> = {
    ${getApiDefinitions(ast)
      .map((d) => {
        return apiDefinition(d);
      })
      .join('\n')}
    }
    const RestPlugin: FastifyPluginAsync<{routes:Api; setContext: (req: FastifyRequest) => any;}> = async (fastify, options) => {
    fastify.decorateRequest("restplugin_context", null);

    fastify.addHook("preHandler", (req, _, done) => {
      (req as any).restplugin_context = options.setContext(req);
      done();
    });
      fastify.addSchema(JsonSchema)
      ${getApiDefinitions(ast).map(fastify).join('\n')}
    }
    export default RestPlugin
    `,
    {
      parser: 'typescript',
      ...prettierConfig,
    },
  );
};

export default generateFastify;
