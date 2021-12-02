import prettier from 'prettier';
import {
  ApiDefinition,
  ApiFieldDefinition,
  Ast,
  BooleanLiteral,
  BooleanVariable,
  FloatLiteral,
  FloatVariable,
  IntLiteral,
  IntVariable,
  ObjectField,
  StringLiteral,
  StringVariable,
  TypeReference,
  UnionItem,
} from '../ApiParser';
import JsonSchema, { schemaId } from '../JsonSchema';
import { getApiDefinitions, getDeclarations } from '../AstQuery';

const Type = (
  d:
    | BooleanVariable
    | IntVariable
    | StringVariable
    | FloatVariable
    | BooleanLiteral
    | IntLiteral
    | StringLiteral
    | FloatLiteral
    | TypeReference,
): string => {
  switch (d.variableType) {
    case 'Int':
      return 'number';
    case 'IntLiteral':
      return `${d.value}`;
    case 'String':
      return 'string';
    case 'StringLiteral':
      return `"${d.value}"`;
    case 'Boolean':
      return 'boolean';
    case 'BooleanLiteral':
      return `${d.value}`;
    case 'Float':
      return 'number';
    case 'FloatLiteral':
      return `${d.value}`;
    case 'TypeReference':
      return d.value;
    default:
      throw `unsupported type`;
  }
};
const union = (union: UnionItem) => {
  return union.variableType === 'Object' ? Fields(union.fields) : Type(union);
};

const field = (field: ObjectField) => {
  return `${field.name}${field.isRequired ? ':' : '?:'} ${
    field.variableType === 'Object'
      ? Fields(field.fields)
      : field.variableType === 'Union'
      ? field.unions.map(union).join(' | ')
      : field.variableType === 'Array'
      ? `(${Type(field.items)}${field.items.isRequired === false ? ' | null' : ''})[]`
      : Type(field)
  }`;
};

const Fields = (fields: ObjectField[]): string => {
  return `{
    ${fields.map(field).join('\n')}
  }`;
};

const ApiDefinitionInput = (d: ApiFieldDefinition | undefined) => {
  if (d === undefined) {
    return 'undefined';
  }
  return `${
    d.variableType === 'Object'
      ? Fields(d.fields)
      : d.variableType === 'Array'
      ? `(${Type(d.items)}${d.items.isRequired === false ? ' | null' : ''})[]`
      : Type(d)
  }`;
};

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
          return `${t}: ${ApiDefinitionInput(x)}`;
        })
        .filter((x) => !!x)
        .join(',\n')} 
    }, context: T) => ${d.responses
      .map(({ body, headers, status }) => {
        return `MaybePromise<{
    code: ${status};
    ${[body ? `body: ${ApiDefinitionInput(body)}` : '', headers ? `headers: ${ApiDefinitionInput(headers)}` : '']
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
      d.params ? `Params: ${ApiDefinitionInput(d.params)}` : '',
      d.query ? `Querystring: ${ApiDefinitionInput(d.query)}` : '',
      d.body ? `Body: ${ApiDefinitionInput(d.body)}` : '',
      d.headers ? `Headers: ${ApiDefinitionInput(d.headers)}` : '',
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
      reply.send(response.body)
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

    ${getDeclarations(ast)
      .map((d) => {
        if (d.variableType === 'Object') {
          return `export type ${d.name} = {
            ${d.fields.map(field).join('\n')}
          }`;
        }
        if (d.variableType === 'Union') {
          return `export type ${d.name} = ${d.unions.map(union).join(' | ')}`;
        }
      })
      .join('\n')}
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
    { parser: 'typescript' },
  );
};

export default generateFastify;
