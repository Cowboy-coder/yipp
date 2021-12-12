import {
  ApiDefinition,
  ApiSyntaxError,
  ArrayVariable,
  Ast,
  BodyType,
  EnumDeclaration,
  HeaderType,
  ObjectVariable,
  QueryType,
  TypeDeclaration,
  TypeReference,
  UnionDeclaration,
} from './ApiParser';
import { Token } from './ApiTokenizer';
import { getApiDefinitions, getDeclarations } from './AstQuery';

const rules = {
  headers: ['String', 'StringLiteral'],
  query: ['Int', 'Float', 'String'],
};

const validateTypeRef = (
  obj: ObjectVariable | ArrayVariable | TypeReference | undefined,
  declarations: (TypeDeclaration | EnumDeclaration | UnionDeclaration)[],
): Token | undefined => {
  if (obj === undefined) {
    return undefined;
  }

  if (obj.variableType === 'Object') {
    for (const field of obj.fields) {
      if (field.variableType === 'Object' || field.variableType === 'Array' || field.variableType === 'TypeReference') {
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

const validateHeaders = (
  header: HeaderType | undefined,
  declarations: (TypeDeclaration | EnumDeclaration | UnionDeclaration)[],
) => {
  if (!header) {
    return;
  }

  if (header.variableType === 'TypeReference') {
    const errorToken = validateTypeRef(header, declarations);
    if (errorToken) {
      throw new ApiSyntaxError(`Type '${errorToken.value}' not found`, errorToken);
    }

    const found = declarations.find((d) => d.name === header.value);
    if (found?.type === 'EnumDeclaration') {
      throw new ApiSyntaxError(`Type '${header.token.value}' can not be referencing an Enum`, header.token);
    }
    if (found?.type === 'UnionDeclaration') {
      throw new ApiSyntaxError(`Type '${header.token.value}' can not be referencing an Union`, header.token);
    }
    if (found?.variableType === 'Object') {
      validateObject(found, rules.headers, header);
    } else {
      throw new ApiSyntaxError(`Type '${header.token.value}' can only be referencing an Object`, header.token);
    }
  } else if (header.variableType === 'Object') {
    validateObject(header, rules.headers);
  }

  if (header.variableType === 'Object') {
    validateDuplicateFields(header);
  }
};

const validateQuery = (
  query: QueryType | undefined,
  declarations: (TypeDeclaration | EnumDeclaration | UnionDeclaration)[],
) => {
  if (!query) {
    return;
  }

  if (query.variableType === 'TypeReference') {
    const errorToken = validateTypeRef(query, declarations);
    if (errorToken) {
      throw new ApiSyntaxError(`Type '${errorToken.value}' not found`, errorToken);
    }
    const found = declarations.find((d) => d.name === query.value);
    if (found?.type === 'EnumDeclaration') {
      throw new ApiSyntaxError(`Type '${query.token.value}' can not be referencing an Enum`, query.token);
    }
    if (found?.type === 'UnionDeclaration') {
      throw new ApiSyntaxError(`Type '${query.token.value}' can not be referencing an Union`, query.token);
    }
    if (found?.variableType === 'Object') {
      validateObject(found, rules.query, query);
    } else {
      throw new ApiSyntaxError(`Type '${query.token.value}' can only be referencing an Object`, query.token);
    }
  } else if (query.variableType === 'Object') {
    validateObject(query, rules.query);
  }

  if (query.variableType === 'Object') {
    validateDuplicateFields(query);
  }
};

const validateBody = (
  body: BodyType | undefined,
  declarations: (TypeDeclaration | EnumDeclaration | UnionDeclaration)[],
) => {
  const errorReferenceToken = validateTypeRef(body, declarations);
  if (errorReferenceToken) {
    throw new ApiSyntaxError(`Type '${errorReferenceToken.value}' not found`, errorReferenceToken);
  }

  if (body?.variableType === 'Object') {
    validateDuplicateFields(body);
  }
};

const validateDuplicateFields = (obj: ObjectVariable | EnumDeclaration) => {
  const foundFields: string[] = [];
  obj.fields.forEach((field) => {
    if (field.variableType === 'Object') {
      validateDuplicateFields(field);
    }
    if (foundFields.includes(field.name)) {
      throw new ApiSyntaxError(`Field is already defined`, field.token);
    }
    foundFields.push(field.name);
  });
};

const validateDuplicateUnionItems = (obj: UnionDeclaration) => {
  const foundFields: string[] = [];
  obj.items.forEach((item) => {
    if (foundFields.includes(item.value)) {
      throw new ApiSyntaxError(`Union item is already defined`, item.token);
    }
    foundFields.push(item.value);
  });
};

const validateDeclaration = (
  d: (TypeDeclaration | EnumDeclaration | UnionDeclaration) | undefined,
  declarations: (TypeDeclaration | EnumDeclaration | UnionDeclaration)[],
) => {
  if (d?.type === 'EnumDeclaration') {
    validateDuplicateFields(d);
    return;
  }
  if (d?.type === 'UnionDeclaration') {
    validateDuplicateUnionItems(d);

    d.items.forEach((item) => {
      const foundDeclaration = declarations.find((declaration) => declaration.name === item.value);
      if (!foundDeclaration) {
        throw new ApiSyntaxError(`Type "${item.value}" not found`, item.token);
      }
      if (foundDeclaration.type !== 'TypeDeclaration') {
        throw new ApiSyntaxError('Only type declarations can be used in unions', item.token);
      }
      const hasDiscriminator = foundDeclaration.fields.find((f) => f.name === d.discriminator);
      if (!hasDiscriminator) {
        throw new ApiSyntaxError(
          `${item.value} needs a "${d.discriminator}" field defined to be part of the Union`,
          item.token,
        );
      }
    });
    return;
  }

  const errorReferenceToken = validateTypeRef(d, declarations);
  if (errorReferenceToken) {
    throw new ApiSyntaxError(`Type '${errorReferenceToken.value}' not found`, errorReferenceToken);
  }

  if (d?.variableType === 'Object') {
    validateDuplicateFields(d);
  }

  const foundTypes: string[] = [];
  declarations.forEach((d) => {
    if (foundTypes.includes(d.name)) {
      throw new ApiSyntaxError(`Duplicate type declaration`, d.token);
    }
    foundTypes.push(d.name);
  });
};

const validateApis = (apis: ApiDefinition[]) => {
  const foundApis: string[] = [];
  apis.forEach((api) => {
    if (foundApis.includes(api.name)) {
      throw new ApiSyntaxError(`Duplicate api definition`, api.token);
    }
    foundApis.push(api.name);
  });
};

// Because we are parsing the syntax from left to right we don't know if it
// produces valid code until after the whole Syntax Tree has been parsed.
// So this function is post-parse analyzing the AST.
const AnalyzeAst = (ast: Ast) => {
  const declarations = getDeclarations(ast);
  const apis = getApiDefinitions(ast);
  validateApis(apis);

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
