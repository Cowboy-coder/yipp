import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import { ApiDefinition, Ast } from '../ApiParser';
import { getApiDefinitions, getDeclarations } from '../AstQuery';
import JsonSchema, { schemaId } from '../JsonSchema';
import { generateApiField, generateDeclarations } from './commonTs';

const prettierConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')).prettier;

const apiDefinition = (d: ApiDefinition) => {
  return `
  ${d.name}: (
    req: {
      ${(['params', 'query', 'body', 'headers'] as const)
        .map((t) => {
          const x = d[t];
          if (x === undefined) {
            return '';
          }
          return `${t}: ${generateApiField(x)}`;
        })
        .filter((x) => !!x)
        .join(',\n')} 
    }, context: T) => ${d.responses
      .map(({ body, headers, status }) => {
        return `MaybePromise<{
    code: ${status};
    ${[body ? `body: ${generateApiField(body)}` : '', headers ? `headers: ${generateApiField(headers)}` : '']
      .filter((x) => !!x)
      .join(';\n')}
  }>`;
      })
      .join(' | ')}
  `;
};

const fastify = (d: ApiDefinition) => {
  return `
  fastify.${d.method.toLowerCase()}<{
    ${[
      d.params ? `Params: ${generateApiField(d.params)}` : '',
      d.query ? `Querystring: ${generateApiField(d.query)}` : '',
      d.body ? `Body: ${generateApiField(d.body)}` : '',
      d.headers ? `Headers: ${generateApiField(d.headers)}` : '',
    ]
      .filter((x) => !!x)
      .join(',')}
  }>("${d.path}", {
    schema: {
    ${[
      d.params ? `params: { $ref: "${schemaId(d.name)}_params"}` : undefined,
      d.query ? `querystring: { $ref: "${schemaId(d.name)}_query"}` : undefined,
      d.headers ? `headers: { $ref: "${schemaId(d.name)}_headers"}` : undefined,
      d.body ? `body: { $ref: "${schemaId(d.name)}_body"}` : undefined,
      `response: {${d.responses
        .map((r) => `"${r.status}": {$ref: "${schemaId(`${d.name}_${r.status}"}`)}`)
        .filter((x) => !!x)
        .join(',')}}`,
    ]
      .filter((x) => !!x)
      .join(',')},
    }
  }, async (req, reply) => {
    const response = await options.routes.${d.name}({
    ${[
      d.params ? 'params: {...req.params}' : '',
      d.query ? 'query: {...req.query}' : '',
      d.body ? 'body: {...req.body}' : '',
      d.headers ? 'headers: {...req.headers}' : '',
    ]
      .filter((x) => !!x)
      .join(',')}
    }, (req as any).restplugin_context);

    if ("headers" in response && (response as any).headers) {
      reply.headers((response as any).headers);
    }

    reply.code(response.code)
    if ("body" in response && (response as any).body) {
      reply.send((response as any).body)
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
      JsonSchema.forEach(schema => fastify.addSchema(schema))
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
