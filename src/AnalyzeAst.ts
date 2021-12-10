import {
  ApiSyntaxError,
  ArrayVariable,
  Ast,
  BodyType,
  HeaderType,
  ObjectVariable,
  QueryType,
  TypeDeclaration,
  TypeReference,
  UnionVariable,
} from './ApiParser';
import { Token } from './ApiTokenizer';
import { getApiDefinitions, getDeclarations } from './AstQuery';

const rules = {
  headers: ['String', 'StringLiteral'],
  query: ['Int', 'Float', 'String'],
};

const validateTypeRef = (
  obj: ObjectVariable | ArrayVariable | UnionVariable | TypeReference | undefined,
  declarations: TypeDeclaration[],
): Token | undefined => {
  if (obj === undefined) {
    return undefined;
  }

  if (obj.variableType === 'Object') {
    for (const field of obj.fields) {
      if (
        field.variableType === 'Object' ||
        field.variableType === 'Array' ||
        field.variableType === 'Union' ||
        field.variableType === 'TypeReference'
      ) {
        const errorToken = validateTypeRef(field, declarations);
        if (errorToken) {
          return errorToken;
        }
      }
    }
  } else if (obj.variableType === 'Union') {
    for (const field of obj.unions) {
      if (field.variableType === 'Object' || field.variableType === 'TypeReference') {
        const errorToken = validateTypeRef(field, declarations);
        if (errorToken) {
          return errorToken;
        }
      }
    }
  } else if (obj.variableType === 'Array' && obj.items.variableType === 'TypeReference') {
    const value = obj.items.value;
    if (!declarations.find((d) => d.name === value)) {
      return obj.items.token;
    }
  } else if (obj.variableType === 'TypeReference') {
    if (!declarations.find((d) => d.name === obj.value)) {
      return obj.token;
    }
  }

  return undefined;
};

const validateObject = (obj: ObjectVariable, validFields: string[], typeRef: TypeReference | undefined = undefined) => {
  obj.fields.forEach((field) => {
    if (!validFields.includes(field.variableType)) {
      if (typeRef) {
        throw new ApiSyntaxError(`This type can only contain fields of type ${validFields.join(',')}`, typeRef.token);
      } else {
        throw new ApiSyntaxError(`Field is only allowed be of type ${validFields.join(',')}`, field.token);
      }
    }
  });
};

const validateHeaders = (header: HeaderType | undefined, declarations: TypeDeclaration[]) => {
  if (!header) {
    return;
  }

  if (header.variableType === 'TypeReference') {
    const errorToken = validateTypeRef(header, declarations);
    if (errorToken) {
      throw new ApiSyntaxError(`Type '${errorToken.value}' not found`, errorToken);
    }

    const found = declarations.find((d) => d.name === header.value);
    if (found?.variableType === 'Object') {
      validateObject(found, rules.headers, header);
    } else {
      throw new ApiSyntaxError(`Type '${header.token.value}' can only be referencing an Object`, header.token);
    }
  } else if (header.variableType === 'Object') {
    validateObject(header, rules.headers);
  }
};

const validateQuery = (query: QueryType | undefined, declarations: TypeDeclaration[]) => {
  if (!query) {
    return;
  }

  if (query.variableType === 'TypeReference') {
    const errorToken = validateTypeRef(query, declarations);
    if (errorToken) {
      throw new ApiSyntaxError(`Type '${errorToken.value}' not found`, errorToken);
    }
    const found = declarations.find((d) => d.name === query.value);
    if (found?.variableType === 'Object') {
      validateObject(found, rules.query, query);
    } else {
      throw new ApiSyntaxError(`Type '${query.token.value}' can only be referencing an Object`, query.token);
    }
  } else if (query.variableType === 'Object') {
    validateObject(query, rules.query);
  }
};

const validateBody = (body: BodyType | undefined, declarations: TypeDeclaration[]) => {
  const errorReferenceToken = validateTypeRef(body, declarations);
  if (errorReferenceToken) {
    throw new ApiSyntaxError(`Type '${errorReferenceToken.value}' not found`, errorReferenceToken);
  }
};

const validateDeclaration = (d: TypeDeclaration | undefined, declarations: TypeDeclaration[]) => {
  const errorReferenceToken = validateTypeRef(d, declarations);
  if (errorReferenceToken) {
    throw new ApiSyntaxError(`Type '${errorReferenceToken.value}' not found`, errorReferenceToken);
  }
};

// Because we are parsing the syntax from left to right we don't know if it
// produces valid code until after the whole Syntax Tree has been parsed.
// So this function is post-parse analyzing the AST.
const AnalyzeAst = (ast: Ast) => {
  const declarations = getDeclarations(ast);
  const apis = getApiDefinitions(ast);

  declarations.forEach((d) => validateDeclaration(d, declarations));
  apis.forEach((api) => {
    validateHeaders(api.headers, declarations);
    validateQuery(api.query, declarations);
    validateBody(api.body, declarations);
    api.responses.forEach((r) => {
      validateHeaders(r.headers, declarations);
      validateBody(r.body, declarations);
    });
  });

  return ast;
};
export default AnalyzeAst;
