import fs from "fs";
import prettier from "prettier";
import ApiParser, {
  ApiDefinition,
  ApiFieldDefinition,
  Ast,
  Field,
  TypeDeclaration,
  Union,
} from "./ApiParser";
import JsonSchema, { schemaId } from "./JsonSchema";
import { getApiDefinitions, getDeclarations } from "./AstQuery";

const Type = (variableType: string | number) => {
  switch (variableType) {
    case "Int":
      return "number";
    case "String":
      return "string";
    default:
      return variableType;
  }
};
const typeDeclaration = (d: any) => {
  return `
  export type ${d.name} = {
    ${d.fields.map(field).join("\n")}
  }
  `;
};

const union = (union: Union) => {
  return union.variableType === "AnonymousTypeDeclaration" && "fields" in union
    ? Fields(union.fields)
    : Type(union.variableType);
};

const UnionDeclaration = (d: any) => {
  return `
  export type ${d.name} = ${d.unions.map(union).join(" | ")}
  `;
};

const field = (field: Field) => {
  return `${field.id}${field.isRequired ? ":" : "?:"} ${
    field.variableType === "AnonymousTypeDeclaration" && "fields" in field
      ? Fields(field.fields)
      : field.variableType === "UnionDeclaration" && "unions" in field
      ? field.unions.map(union).join(" | ")
      : field.variableType === "Array" && "item" in field
      ? `(${Type(field.item.variableType)}${
          field.item.isRequired === false ? " | undefined" : ""
        })[]`
      : Type(field.variableType)
  }`;
};

const Fields = (fields: Field[]): string => {
  return `{
    ${fields.map(field).join("\n")}
  }`;
};

const ApiDefinitionInput = (d: ApiFieldDefinition | undefined) => {
  if (d === undefined) {
    return "undefined";
  }
  return `${
    d.variableType === "AnonymousTypeDeclaration" && "fields" in d
      ? Fields(d.fields ?? [])
      : d.variableType === "Array" && d.item
      ? `${Type(d.item.variableType)}[]`
      : Type(d.variableType)
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
    reply.code(response.code).send(response.body);
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
        if (d.type === "TypeDeclaration") {
          return typeDeclaration(d);
        }
        if (d.type === "UnionDeclaration") {
          return UnionDeclaration(d);
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
