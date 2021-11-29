import fs from "fs";
import prettier from "prettier";
import ApiParser, {
  ApiDefinition,
  ApiFieldDefinition,
  Ast,
  Field,
  Union,
} from "./ApiParser";
import { getApiDefinitions, getDeclarations } from "./AstQuery";

const Type = (variableType: string | number) => {
  switch (variableType) {
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

const ApiDefinitionInput = (d: ApiFieldDefinition) => {
  return `${
    d.variableType === "AnonymousTypeDeclaration" && "fields" in d
      ? Fields(d.fields ?? [])
      : Type(d.variableType)
  }`;
};

const apiDefinition = (d: ApiDefinition) => {
  return `
  ${d.name}: (
    req: {
      ${(["params", "query", "body"] as const)
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
      .map(({ body, status }) => {
        return `{
    code: ${status};
    body: ${
      body.variableType === "AnonymousTypeDeclaration"
        ? Fields(body.fields ?? [])
        : Type(body.variableType)
    }
  }`;
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
    ]
      .filter((x) => !!x)
      .join(",")}
    ,
  }>("${d.path}", (req, reply) => {
    const response = routes.${d.name}({
    ${[
      d.params ? "params: req.params" : "",
      d.query ? "query: req.query" : "",
      d.body ? "body: req.body" : "",
    ]
      .filter((x) => !!x)
      .join(",")}
    });
    reply.code(response.code).send(response.body);
  })
  `;
};

const routes = (definitions: ApiDefinition[]) => {
  return `export const addRoutes = (fastify:FastifyInstance, routes:Api) => {
    ${definitions.map(fastify).join("\n")}
  }`;
};

const compile = (ast: Ast) => {
  return prettier.format(
    `
    import { FastifyInstance } from "fastify";

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
