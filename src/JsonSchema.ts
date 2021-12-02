import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { ApiFieldDefinition, ArrayItem, Ast, ObjectField, UnionItem } from './ApiParser';
import { getDeclarations, getApiDefinitions } from './AstQuery';

export const schemaId = (str: string) => `https://example.com/#${str}`;

const fieldSchema = (field: ObjectField | UnionItem | ArrayItem): JSONSchema7Definition => {
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

  if (field.variableType === 'TypeReference') {
    return { $ref: schemaId(field.value) };
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

const apiFieldDefinitionSchema = ($id: string, d: ApiFieldDefinition | undefined): JSONSchema7 => {
  if (d === undefined) {
    return {
      $id,
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
      $id,
      type: 'object',
      properties,
      required: (d.fields ?? []).filter((f) => f.isRequired).map((f) => f.name),
    } as JSONSchema7;
  } else if (d.variableType === 'Array') {
    return {
      $id,
      type: 'array',
      items: d.items.isRequired ? fieldSchema(d.items) : { oneOf: [{ type: 'null' }, fieldSchema(d.items)] },
    };
  } else if (d.variableType === 'TypeReference') {
    return {
      $id,
      $ref: schemaId(d.value),
    } as JSONSchema7;
  }
  throw new Error('unsupported variableType in apiFieldDefinitionSchema');
};

const JsonSchema = (ast: Ast): JSONSchema7[] => {
  const declarations = getDeclarations(ast);
  const apis = getApiDefinitions(ast);

  return [
    ...declarations.map((d) => {
      const $id = schemaId(d.name);
      if (d.variableType === 'Object') {
        const properties: {
          [key: string]: JSONSchema7Definition;
        } = {};
        d.fields.forEach((field) => {
          properties[field.name] = fieldSchema(field);
        });
        return {
          $id,
          type: 'object',
          properties,
          required: d.fields.filter((f) => f.isRequired).map((f) => f.name),
        } as JSONSchema7;
      } else if (d.variableType === 'Union') {
        return {
          $id,
          oneOf: d.unions.map((union) => {
            return fieldSchema(union);
          }),
        };
      }
      throw new Error(`Json Schema unsupported declaration`);
    }),
    ...apis
      .map((api) => {
        return [
          ...(['params', 'query', 'body', 'headers'] as const)
            .map((key) => {
              const current = api[key];
              if (!current) {
                return undefined;
              }

              const $id = schemaId(`${api.name}_${key}`);
              return apiFieldDefinitionSchema($id, current);
            })
            .filter((x): x is JSONSchema7 => !!x),
          ...api.responses.map((response) => {
            const $id = schemaId(`${api.name}_${response.status}`);
            return apiFieldDefinitionSchema($id, response.body);
          }),
        ];
      })
      .flat(),
  ];
};

export default JsonSchema;
