import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import {
  ApiFieldDefinition,
  ArrayItem,
  ArrayVariable,
  Ast,
  ObjectField,
  ObjectVariable,
  TypeReference,
  UnionItem,
  UnionVariable,
} from './ApiParser';
import { getApiDefinitions, getDeclarations } from './AstQuery';

export const schemaId = (str: string) => `https://example.com/#${str}`;

const fieldSchema = (
  field: ObjectField | ObjectVariable | TypeReference | ArrayVariable | ArrayItem | UnionVariable | UnionItem,
): JSONSchema7Definition => {
  if (field.variableType === 'Object') {
    const properties: {
      [key: string]: JSONSchema7Definition;
    } = {};
    field.fields.forEach((field) => {
      properties[field.name] = fieldSchema(field);
    });
    return {
      type: 'object',
      properties,
      required: (field.fields ?? []).filter((f) => f.isRequired).map((f) => f.name),
    };
  }
  if (field.variableType === 'IntLiteral') {
    return { const: field.value };
  }

  if (field.variableType === 'StringLiteral') {
    return { const: field.value };
  }

  if (field.variableType === 'Int') {
    return { type: 'number' };
  }

  if (field.variableType === 'String') {
    return { type: 'string' };
  }

  if (field.variableType === 'Boolean') {
    return { type: 'boolean' };
  }

  if (field.variableType === 'BooleanLiteral') {
    return { const: field.value };
  }

  if (field.variableType === 'Float') {
    return { const: 'number' };
  }

  if (field.variableType === 'FloatLiteral') {
    return { const: field.value };
  }

  if (field.variableType === 'DateTime') {
    return { type: 'string', format: 'date-time' };
  }

  if (field.variableType === 'TypeReference') {
    return { $ref: `#/definitions/${field.value}` };
  }

  if (field.variableType === 'Array') {
    return {
      type: 'array',
      items: field.items.isRequired
        ? fieldSchema(field.items)
        : { oneOf: [{ type: 'null' }, fieldSchema(field.items)] },
    };
  }
  if (field.variableType === 'Union') {
    return {
      oneOf: field.unions.map((union) => {
        return fieldSchema(union);
      }),
    };
  }
  throw new Error(`Unsupported field`);
};

const apiFieldDefinitionSchema = (d: ApiFieldDefinition): JSONSchema7 => {
  if (d === undefined) {
    return {
      type: 'null',
    };
  }
  if (d.variableType === 'Object') {
    const properties: {
      [key: string]: JSONSchema7Definition;
    } = {};
    d.fields.forEach((field) => {
      properties[field.name] = fieldSchema(field);
    });
    return {
      type: 'object',
      properties,
      required: (d.fields ?? []).filter((f) => f.isRequired).map((f) => f.name),
    } as JSONSchema7;
  } else if (d.variableType === 'Array') {
    return {
      type: 'array',
      items: d.items.isRequired ? fieldSchema(d.items) : { oneOf: [{ type: 'null' }, fieldSchema(d.items)] },
    };
  } else if (d.variableType === 'TypeReference') {
    return {
      $ref: `#/definitions/${d.value}`,
    } as JSONSchema7;
  }
  throw new Error('unsupported variableType in apiFieldDefinitionSchema');
};

const JsonSchema = (ast: Ast): JSONSchema7 => {
  const declarations = getDeclarations(ast);
  const apis = getApiDefinitions(ast);

  const schema: JSONSchema7 = {
    $id: 'schema',
    type: 'object',
    definitions: {
      ...declarations.reduce((acc, d) => {
        if (d.type === 'EnumDeclaration') {
          return {
            ...acc,
            [d.name]: {
              enum: d.fields.map((f) => f.value),
            },
          };
        } else if (d.variableType === 'Object') {
          const properties: {
            [key: string]: JSONSchema7Definition;
          } = {};
          d.fields.forEach((field) => {
            properties[field.name] = fieldSchema(field);
          });
          return {
            ...acc,
            [d.name]: {
              type: 'object',
              properties,
              required: d.fields.filter((f) => f.isRequired).map((f) => f.name),
            },
          };
        } else if (d.variableType === 'Union') {
          return {
            ...acc,
            [d.name]: {
              oneOf: d.unions.map((union) => {
                return fieldSchema(union);
              }),
            },
          };
        }
        throw new Error(`Json Schema unsupported declaration`);
      }, {} as { [key: string]: JSONSchema7Definition }),
      ...apis.reduce((acc, api) => {
        const obj: { [key: string]: JSONSchema7Definition } = {};
        const params = ['params', 'query', 'body', 'headers'] as const;
        params.forEach((key) => {
          const current = api[key];
          if (!current) {
            return undefined;
          }

          obj[`${api.name}_${key}`] = apiFieldDefinitionSchema(current);
        });
        api.responses.forEach((response) => {
          obj[`${api.name}_${response.status}`] = apiFieldDefinitionSchema(response.body);
        });

        return {
          ...acc,
          ...obj,
        };
      }, {} as { [key: string]: JSONSchema7Definition }),
    },
  };
  return schema;
};

export default JsonSchema;
