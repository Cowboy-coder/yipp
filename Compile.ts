import fs from "fs";
import prettier from "prettier";
import ApiParser, {
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
} from "./ApiParser";
import JsonSchema, { schemaId } from "./JsonSchema";
import { getApiDefinitions, getDeclarations } from "./AstQuery";

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
    | TypeReference
) => {
  switch (d.variableType) {
    case "Int":
      return "number";
    case "String":
      return "string";
    case "StringLiteral":
      return `"${d.value}"`;
    case "IntLiteral":
      return d.value;
    case "TypeReference":
      return d.value;
    default:
      throw `unsupported type in Type ${d.variableType}`;
  }
};
const union = (union: UnionItem) => {
  return union.variableType === "Object" ? Fields(union.fields) : Type(union);
};

const field = (field: ObjectField) => {
  return `${field.name}${field.isRequired ? ":" : "?:"} ${
    field.variableType === "Object"
      ? Fields(field.fields)
      : field.variableType === "Union"
      ? field.unions.map(union).join(" | ")
      : field.variableType === "Array"
      ? `(${Type(field.items)}${
          field.items.isRequired === false ? " | null" : ""
        })[]`
      : Type(field)
  }`;
};

const Fields = (fields: ObjectField[]): string => {
  return `{
    ${fields.map(field).join("\n")}
  }`;
};

const ApiDefinitionInput = (d: ApiFieldDefinition | undefined) => {
  if (d === undefined) {
    return "undefined";
  }
  return `${
    d.variableType === "Object"
      ? Fields(d.fields)
      : d.variableType === "Array"
      ? `(${Type(d.items)}${d.items.isRequired === false ? " | null" : ""})[]`
      : Type(d)
  }`;
};

const apiDefinition = (d: ApiDefinition) => {
  return `
  ${d.name}: (
    req: {
      ${(["params", "query", "body", "headers"] as const)
        .map((t) => {
          const x = d[t];
          if (x === undefined) {
            return "";
          }
          return `${t}: ${ApiDefinitionInput(x)}`;
        })
        .filter((x) => !!x)
        .join(",\n")} 
    }) => ${d.responses
      .map(({ body, headers, status }) => {
        return `MaybePromise<{
    code: ${status};
    ${[
      body ? `body: ${ApiDefinitionInput(body)}` : "",
      headers ? `headers: ${ApiDefinitionInput(headers)}` : "",
    ]
      .filter((x) => !!x)
      .join(";\n")}
  }>`;
      })
      .join(" | ")}
  `;
};

const fastify = (d: ApiDefinition) => {
  return `
  fastify.${d.method.toLowerCase()}<{
    ${[
      d.params ? `Params: ${ApiDefinitionInput(d.params)}` : "",
      d.query ? `Querystring: ${ApiDefinitionInput(d.query)}` : "",
      d.body ? `Body: ${ApiDefinitionInput(d.body)}` : "",
      d.headers ? `Headers: ${ApiDefinitionInput(d.headers)}` : "",
    ]
      .filter((x) => !!x)
      .join(",")}
  }>("${d.path}", {
    schema: {
    ${[
      d.params ? `params: { $ref: "${schemaId(d.name)}_params"}` : undefined,
      d.query ? `querystring: { $ref: "${schemaId(d.name)}_query"}` : undefined,
      d.headers ? `headers: { $ref: "${schemaId(d.name)}_headers"}` : undefined,
      d.body ? `body: { $ref: "${schemaId(d.name)}_body"}` : undefined,
      `response: {${d.responses
        .map(
          (r) => `"${r.status}": {$ref: "${schemaId(`${d.name}_${r.status}"}`)}`
        )
        .filter((x) => !!x)
        .join(",")}}`,
    ]
      .filter((x) => !!x)
      .join(",")},
    }
  }, async (req, reply) => {
    const response = await routes.${d.name}({
    ${[
      d.params ? "params: {...req.params}" : "",
      d.query ? "query: {...req.query}" : "",
      d.body ? "body: {...req.body}" : "",
      d.headers ? "headers: {...req.headers}" : "",
    ]
      .filter((x) => !!x)
      .join(",")}
    });

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

const routes = (definitions: ApiDefinition[]) => {
  return `export const addRoutes = (fastify:FastifyInstance, routes:Api) => {
    JsonSchema.forEach(schema => fastify.addSchema(schema))
    ${definitions.map(fastify).join("\n")}
  }`;
};

const compile = (ast: Ast) => {
  return prettier.format(
    `
    import { FastifyInstance } from "fastify";

    export const JsonSchema = ${JSON.stringify(JsonSchema(ast), null, 2)};

    type MaybePromise<T> = Promise<T> | T;

    ${getDeclarations(ast)
      .map((d) => {
        if (d.variableType === "Object") {
          return `export type ${d.name} = {
            ${d.fields.map(field).join("\n")}
          }`;
        }
        if (d.variableType === "Union") {
          return `export type ${d.name} = ${d.unions.map(union).join(" | ")}`;
        }
      })
      .join("\n")}
    export type Api = {
    ${getApiDefinitions(ast)
      .map((d) => {
        return apiDefinition(d);
      })
      .join("\n")}
    }
    ${routes(getApiDefinitions(ast))}
    `,
    { parser: "typescript" }
  );
};

const parser = new ApiParser();
const ast = parser.parse(
  fs.readFileSync("./fastifyExample/api.schema", { encoding: "utf8" })
);
fs.writeFileSync("./fastifyExample/generated.ts", compile(ast));
console.log(JSON.stringify(ast, null, 2));
console.log(compile(ast));
