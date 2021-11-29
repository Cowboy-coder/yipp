import { JSONSchema7, JSONSchema7Definition } from "json-schema";
import { ApiFieldDefinition, ArrayItem, Ast, Field, Union } from "./ApiParser";
import { getDeclarations, getApiDefinitions } from "./AstQuery";

export const schemaId = (str: string) => `https://example.com/#${str}`;

const fieldSchema = (
  field: Field | Union | ArrayItem
): JSONSchema7Definition => {
  if (field.variableType === "AnonymousTypeDeclaration" && "fields" in field) {
    const properties: {
      [key: string]: JSONSchema7Definition;
    } = {};
    (field.fields ?? ([] as Field[])).forEach((field) => {
      properties[field.id] = fieldSchema(field);
    });
    return {
      type: "object",
      properties,
      required: (field.fields ?? [])
        .filter((f) => f.isRequired)
        .map((f) => f.id),
    };
  }
  if (typeof field.variableType === "number") {
    return { const: field.variableType };
  }
  if (field.variableType === "Int") {
    return { type: "number" };
  }
  if (field.variableType.includes('"')) {
    return { const: field.variableType.replace(/\"/g, "") };
  }

  if (field.variableType === "String") {
    return { type: "string" };
  }

  if (field.variableType === "Array" && "item" in field) {
    return {
      type: "array",
      items: fieldSchema(field.item),
    };
  }
  if (field.variableType === "UnionDeclaration" && "unions" in field) {
    return {
      oneOf: field.unions.map((union) => {
        return fieldSchema(union);
      }),
    };
  }
  return { $ref: schemaId(field.variableType) };
};

const apiFieldDefinitionSchema = (
  $id: string,
  d: ApiFieldDefinition
): JSONSchema7 => {
  if (d.variableType === "AnonymousTypeDeclaration" && "fields" in d) {
    const properties: {
      [key: string]: JSONSchema7Definition;
    } = {};
    (d.fields ?? []).forEach((field) => {
      properties[field.id] = fieldSchema(field);
    });
    return {
      $id,
      type: "object",
      properties,
      required: (d.fields ?? []).filter((f) => f.isRequired).map((f) => f.id),
    } as JSONSchema7;
  } else if (d.variableType === "Array" && d.item) {
    return {
      $id,
      type: "array",
      items: fieldSchema(d.item),
    };
  }
  return {
    $id,
    $ref: schemaId(d.variableType),
  } as JSONSchema7;
};

const JsonSchema = (ast: Ast): JSONSchema7[] => {
  const declarations = getDeclarations(ast);
  const apis = getApiDefinitions(ast);

  return [
    ...declarations.map((d) => {
      const $id = schemaId(d.name);
      if (d.type === "TypeDeclaration") {
        const properties: {
          [key: string]: JSONSchema7Definition;
        } = {};
        (d.fields ?? ([] as Field[])).forEach((field) => {
          properties[field.id] = fieldSchema(field);
        });
        return {
          $id,
          type: "object",
          properties,
          required: (d.fields ?? [])
            .filter((f) => f.isRequired)
            .map((f) => f.id),
        } as JSONSchema7;
      } else if (d.type === "UnionDeclaration") {
        return {
          $id,
          oneOf: d?.unions?.map((union) => {
            return fieldSchema(union);
          }),
        };
      }
      throw new Error(`Json schema unable to parse: ${d.type}`);
    }),
    ...(apis
      .map((api) => {
        return [
          ...(["params", "query", "body"] as const)
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
      .flat() as any),
  ];
};

export default JsonSchema;
