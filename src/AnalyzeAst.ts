import {
  ApiSyntaxError,
  Ast,
  BodyType,
  HeaderType,
  ObjectVariable,
  QueryType,
  TypeDeclaration,
  TypeReference,
} from './ApiParser';
import { getApiDefinitions, getDeclarations } from './AstQuery';

const rules = {
  headers: ['String', 'StringLiteral'],
  query: ['Int', 'Float', 'String'],
};

const validateObject = (
  obj: ObjectVariable,
  validFields: string[],
  document: string,
  typeRef: TypeReference | undefined = undefined,
) => {
  obj.fields.forEach((field) => {
    if (!validFields.includes(field.variableType)) {
      if (typeRef) {
        throw new ApiSyntaxError(
          `This type can only contain fields of type ${validFields.join(',')}`,
          typeRef.token,
          document,
        );
      } else {
        throw new ApiSyntaxError(`Field is only allowed be of type ${validFields.join(',')}`, field.token, document);
      }
    }
  });
};

const validateHeaders = (header: HeaderType | undefined, declarations: TypeDeclaration[], document: string) => {
  if (!header) {
    return;
  }

  if (header.variableType === 'TypeReference') {
    const found = declarations.find((d) => d.name === header.value);
    if (!found) {
      throw new ApiSyntaxError(`Type '${header.value}' not found`, header.token, document);
    }
    if (found.variableType === 'Object') {
      validateObject(found, rules.headers, document, header);
    }
  } else if (header.variableType === 'Object') {
    validateObject(header, rules.headers, document);
  }
};

const validateQuery = (query: QueryType | undefined, declarations: TypeDeclaration[], document: string) => {
  if (!query) {
    return;
  }

  if (query.variableType === 'TypeReference') {
    const found = declarations.find((d) => d.name === query.value);
    if (!found) {
      throw new ApiSyntaxError(`Type '${query.value}' not found`, query.token, document);
    }
    if (found.variableType === 'Object') {
      validateObject(found, rules.query, document, query);
    }
  } else if (query.variableType === 'Object') {
    validateObject(query, rules.query, document);
  }
};

const validateBody = (body: BodyType | undefined, declarations: TypeDeclaration[], document: string) => {
  if (body?.variableType === 'TypeReference') {
    const found = declarations.find((d) => d.name === body.value);
    if (!found) {
      throw new ApiSyntaxError(`Type '${body.value}' not found`, body.token, document);
    }
  }
};

// Because we are parsing the AST from left to right we don't know if it
// produces valid code until after the whole Syntax Tree has been parsed.
// So this function is post-parse analyzing the AST.
const AnalyzeAst = (ast: Ast, document: string) => {
  const declarations = getDeclarations(ast);
  const apis = getApiDefinitions(ast);

  apis.forEach((api) => {
    validateHeaders(api.headers, declarations, document);
    validateQuery(api.query, declarations, document);
    validateBody(api.body, declarations, document);
    api.responses.forEach((r) => {
      validateHeaders(r.headers, declarations, document);
      validateBody(r.body, declarations, document);
    });
  });

  return ast;
};
export default AnalyzeAst;
