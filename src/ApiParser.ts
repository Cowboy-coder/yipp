import ApiTokenizer, { Token } from './ApiTokenizer';

export class ApiSyntaxError extends Error {
  token: Token;
  document: string;
  constructor(message: string, token: Token, document: string) {
    super(message);

    this.name = 'ApiSyntaxError';
    this.message = message;
    this.token = token;
    this.document = document;
    Object.setPrototypeOf(this, ApiSyntaxError.prototype);
  }
}

export type IntVariable = { variableType: 'Int' };
export type FloatVariable = { variableType: 'Float' };
export type StringVariable = { variableType: 'String' };
export type BooleanVariable = { variableType: 'Boolean' };
export type IntLiteral = { variableType: 'IntLiteral'; value: number };
export type FloatLiteral = { variableType: 'FloatLiteral'; value: number };
export type StringLiteral = { variableType: 'StringLiteral'; value: string };
export type BooleanLiteral = { variableType: 'BooleanLiteral'; value: boolean };
export type Builtin =
  | BooleanLiteral
  | BooleanVariable
  | FloatLiteral
  | FloatVariable
  | IntLiteral
  | IntVariable
  | StringLiteral
  | StringVariable;

type defaultUnion = Builtin | TypeReference | ObjectVariable;
export type UnionItem<T = defaultUnion> = {
  type: 'UnionItem';
} & T;

export type UnionVariable<T = defaultUnion> = {
  variableType: 'Union';
  unions: UnionItem<T>[];
};

export type ArrayItem<T = Builtin | TypeReference> = {
  isRequired: boolean;
} & T;

export type ArrayVariable<T = Builtin | TypeReference> = { variableType: 'Array'; items: ArrayItem<T> };

export type ApiResponseDefinition = {
  type: 'ApiResponseDefinition';
  status: number;
  body?: BodyType;
  headers?: HeaderType;
};

type defaultFields = Builtin | TypeReference | UnionVariable | ArrayVariable;

export type ObjectField<T = RecursiveObject<defaultFields>> = {
  type: 'ObjectField';
  name: string;
  isRequired: boolean;
} & T;

export interface ObjectVariable<T = RecursiveObject<defaultFields>> {
  variableType: 'Object';
  fields: ObjectField<T>[];
}

type ObjectOrTypeReference<T> = ObjectVariable<T> | TypeReference;

export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'HEAD';

type ParamsFieldType = ObjectField<IntVariable | FloatVariable | StringVariable>;
type ParamsType = ObjectVariable<IntVariable | FloatVariable | StringVariable>;

type RecursiveObject<T> = T | ObjectVariable<RecursiveObject<T>>;

export type TypeReference = {
  variableType: 'TypeReference';
  value: string;
};

type QueryType = ObjectOrTypeReference<IntVariable | FloatVariable | StringVariable>;
type HeaderType = ObjectOrTypeReference<StringVariable | StringLiteral>;

export type ApiFieldDefinition = HeaderType | QueryType | ParamsType | BodyType | undefined;

type BodyType = TypeReference | ArrayVariable | ObjectVariable;

export type ApiDefinition = {
  type: 'ApiDefinition';
  name: string;
  method: ApiMethod;
  path: string;
  params?: ParamsType;
  query?: QueryType;
  headers?: HeaderType;
  body?: BodyType;
  responses: ApiResponseDefinition[];
};

export type TypeDeclaration = {
  type: 'TypeDeclaration';
  name: string;
} & (ObjectVariable | UnionVariable);

export type Definition = TypeDeclaration | ApiDefinition;

export type Ast = {
  type: 'Document';
  definitions: Definition[];
};

const isBuiltIn = (value: string): value is 'Int' | 'Float' | 'String' | 'Boolean' => {
  return ['Int', 'Float', 'String', 'Boolean'].includes(value);
};

const isApiMethod = (value: string): value is ApiMethod => {
  return ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'HEAD'].includes(value);
};

export default class ApiParser {
  private tokenizer: ApiTokenizer;
  private lookahead: Token;
  private str: string;

  parse(str: string): Ast {
    this.str = str;
    this.tokenizer = new ApiTokenizer(str);

    this.lookahead = this.tokenizer.getNextToken();
    return this.Document();
  }

  reportAndExit(token: Token, error: string): never {
    throw new ApiSyntaxError(error, token, this.str);
  }

  Document(): Ast {
    return {
      type: 'Document',
      definitions: this.Definitions(),
    };
  }

  Definitions(): Definition[] {
    const definitions: (TypeDeclaration | ApiDefinition)[] = [];
    while (this.lookahead.type === 'WORD_WITH_COLON' || this.lookahead.type === 'TYPE_DECLARATION') {
      if (this.lookahead.type === 'WORD_WITH_COLON') {
        definitions.push(this.ApiDefinition());
      } else if (this.lookahead.type === 'TYPE_DECLARATION') {
        definitions.push(this.TypeDeclaration());
      } else {
        this.reportAndExit(this.lookahead, 'TypeDefinition or ApiDefinition required on top-level');
      }
    }
    if (definitions.length === 0 || this.lookahead.type !== 'EOF') {
      this.reportAndExit(this.lookahead, 'TypeDefinition or ApiDefinition required on top-level');
    }
    return definitions;
  }

  TypeDeclaration(): TypeDeclaration {
    const value = this.lookahead.value;
    if (!value) {
      this.reportAndExit(this.lookahead, 'TypeDefinition or ApiDefinition required on top-level');
    }
    this.eat('TYPE_DECLARATION');
    if (this.lookahead.type === '{') {
      const x = this.simpleObjectOrTypeReference();
      if (x.variableType !== 'Object') {
        this.reportAndExit(this.lookahead, 'Type declarations can only be of Object type');
      }
      return {
        type: 'TypeDeclaration',
        name: value.replace('type ', ''),
        ...x,
      };
    } else if (this.lookahead.type === '|') {
      return {
        type: 'TypeDeclaration',
        name: value.replace('type ', ''),
        variableType: 'Union',
        unions: this.Unions(),
      };
    } else {
      this.reportAndExit(this.lookahead, '"{" or "|" required');
    }
  }

  Unions(): UnionItem[] {
    const unions: UnionItem[] = [];

    while (this.lookahead.type === '|') {
      this.eat('|');

      const value = this.lookahead.value;
      if ((this.lookahead as Token).type === 'STRING_LITERAL') {
        this.eat('STRING_LITERAL');
        unions.push({
          type: 'UnionItem',
          variableType: 'StringLiteral',
          value: value.slice(0, -1).slice(1),
        });
      } else if ((this.lookahead as Token).type === 'BOOLEAN_LITERAL') {
        this.eat('BOOLEAN_LITERAL');
        unions.push({
          type: 'UnionItem',
          variableType: 'BooleanLiteral',
          value: value === 'true',
        });
      } else if ((this.lookahead as Token).type === 'INT_LITERAL') {
        this.eat('INT_LITERAL');
        unions.push({
          type: 'UnionItem',
          variableType: 'IntLiteral',
          value: Number(value),
        });
      } else if ((this.lookahead as Token).type === 'FLOAT_LITERAL') {
        this.eat('FLOAT_LITERAL');
        unions.push({
          type: 'UnionItem',
          variableType: 'FloatLiteral',
          value: Number(value),
        });
      } else if ((this.lookahead as Token).type === 'VARIABLE_TYPE') {
        this.eat('VARIABLE_TYPE');
        if (isBuiltIn(value)) {
          unions.push({
            type: 'UnionItem',
            variableType: value,
          });
        } else {
          unions.push({
            type: 'UnionItem',
            variableType: 'TypeReference',
            value,
          });
        }
      } else if ((this.lookahead as Token).type === '{') {
        const x = this.simpleObjectOrTypeReference();
        if (x.variableType === 'Array') {
          this.reportAndExit(this.lookahead, 'Arrays are not allowed inside of a union');
        }
        unions.push({
          type: 'UnionItem',
          ...x,
        });
      }
    }
    if (unions.length === 0) {
      this.reportAndExit(this.lookahead, 'At least one union-item is required');
    }
    return unions;
  }

  ApiDefinition(): ApiDefinition {
    const name = this.lookahead.value.slice(0, -1);
    if (name === undefined) {
      this.reportAndExit(this.lookahead, `Expected a valid name`);
    }
    this.eat('WORD_WITH_COLON');

    const method = this.lookahead.value
      ? isApiMethod(this.lookahead.value)
        ? this.lookahead.value
        : undefined
      : undefined;
    if (method === undefined) {
      this.reportAndExit(this.lookahead, 'Expected a HTTP Method like GET, POST, etc');
    }
    this.eat('API_METHOD');

    let path = '';
    let params: ParamsType | undefined = undefined;
    const paramFields: ParamsFieldType[] = [];

    while (['API_PATH_INT', 'API_PATH_FLOAT', 'API_PATH_STRING', 'API_PATH_SEGMENT'].includes(this.lookahead.type)) {
      if (this.lookahead.type === 'API_PATH_SEGMENT') {
        path += this.lookahead.value;
        this.eat('API_PATH_SEGMENT');
      } else if (this.lookahead.type === 'API_PATH_STRING') {
        path += this.lookahead.value;
        paramFields.push({
          type: 'ObjectField',
          name: this.lookahead.value.replace('/:', ''),
          variableType: 'String',
          isRequired: true,
        });
        this.eat('API_PATH_STRING');
      } else if (this.lookahead.type === 'API_PATH_INT') {
        const name = this.lookahead.value.replace(/\/:(\w+)\(Int\)/, '$1');
        path += `/:${name}`;
        paramFields.push({
          type: 'ObjectField',
          name: name,
          variableType: 'Int',
          isRequired: true,
        });
        this.eat('API_PATH_INT');
      } else if (this.lookahead.type === 'API_PATH_FLOAT') {
        const name = this.lookahead.value.replace(/\/:(\w+)\(Float\)/, '$1');
        path += `/:${name}`;
        paramFields.push({
          type: 'ObjectField',
          name,
          variableType: 'Float',
          isRequired: true,
        });
        this.eat('API_PATH_FLOAT');
      }
    }
    if (paramFields.length > 0) {
      params = {
        variableType: 'Object',
        fields: paramFields,
      };
    }

    if (path === '') {
      this.reportAndExit(this.lookahead, 'Expected a path /foo');
    }

    this.eat('{');

    let query: QueryType | undefined = undefined;
    let body: BodyType | undefined = undefined;
    let headers: HeaderType | undefined = undefined;

    while (this.lookahead.type && ['API_QUERY', 'API_BODY', 'API_HEADERS'].includes(this.lookahead.type)) {
      if ((this.lookahead as Token).type === 'API_QUERY') {
        this.eat('API_QUERY');
        query = this.simpleObjectOrTypeReference() as QueryType; // could possible be invalid but will be after the whole AST is parsed
      }

      if ((this.lookahead as Token).type === 'API_BODY') {
        this.eat('API_BODY');
        body = this.simpleObjectOrTypeReference();
      }

      if ((this.lookahead as Token).type === 'API_HEADERS') {
        this.eat('API_HEADERS');
        headers = this.simpleObjectOrTypeReference() as HeaderType; // could possible be invalid but will be after the whole AST is parsed
      }
    }

    const responses = this.Responses();
    this.eat('}');

    return {
      type: 'ApiDefinition',
      name,
      method,
      path,
      params,
      query,
      body,
      headers,
      responses,
    };
  }

  private isRequired(): boolean {
    if (this.lookahead.type === '!') {
      this.eat('!');
      return true;
    } else {
      return false;
    }
  }
  private simpleObjectOrTypeReference(): ObjectVariable | ArrayVariable | TypeReference {
    if (this.lookahead.type === '[') {
      this.eat('[');
      const value = this.lookahead.value;
      this.eat('VARIABLE_TYPE');
      const isRequired = this.isRequired();
      this.eat(']');
      if (isBuiltIn(value)) {
        return {
          variableType: 'Array',
          items: {
            variableType: value,
            isRequired,
          },
        };
      } else {
        return {
          variableType: 'Array',
          items: {
            variableType: 'TypeReference',
            value,
            isRequired,
          },
        };
      }
    }
    if (this.lookahead.type === 'VARIABLE_TYPE') {
      const value = this.lookahead.value;
      this.eat('VARIABLE_TYPE');
      return {
        variableType: 'TypeReference',
        value,
      };
    }
    this.eat('{');
    const fields: ObjectField[] = [];
    while (this.lookahead.type === 'WORD_WITH_COLON') {
      const name = this.lookahead.value.slice(0, -1);
      this.eat('WORD_WITH_COLON');

      switch ((this.lookahead as Token).type) {
        case '|': {
          const u = this.Unions();
          u.filter((x) => x.variableType);
          fields.push({
            type: 'ObjectField',
            name,
            variableType: 'Union',
            unions: u,
            isRequired: this.isRequired(),
          });
          break;
        }
        case 'STRING_LITERAL': {
          const value = this.lookahead.value.slice(0, -1).slice(1);
          this.eat('STRING_LITERAL');
          fields.push({
            type: 'ObjectField',
            name,
            variableType: 'StringLiteral',
            value,
            isRequired: this.isRequired(),
          });
          break;
        }
        case 'INT_LITERAL': {
          const value = Number(this.lookahead.value);
          this.eat('INT_LITERAL');
          fields.push({
            type: 'ObjectField',
            name,
            variableType: 'IntLiteral',
            value,
            isRequired: this.isRequired(),
          });
          break;
        }
        case 'FLOAT_LITERAL': {
          const value = Number(this.lookahead.value);
          this.eat('FLOAT_LITERAL');
          fields.push({
            type: 'ObjectField',
            name,
            variableType: 'FloatLiteral',
            value,
            isRequired: this.isRequired(),
          });
          break;
        }
        case 'BOOLEAN_LITERAL': {
          const value = this.lookahead.value === 'true';
          this.eat('BOOLEAN_LITERAL');
          fields.push({
            type: 'ObjectField',
            name,
            variableType: 'BooleanLiteral',
            value,
            isRequired: this.isRequired(),
          });
          break;
        }
        case 'VARIABLE_TYPE': {
          const value = this.lookahead.value;
          this.eat('VARIABLE_TYPE');
          if (isBuiltIn(value)) {
            fields.push({
              type: 'ObjectField',
              name,
              variableType: value,
              isRequired: this.isRequired(),
            });
          } else {
            fields.push({
              type: 'ObjectField',
              name,
              variableType: 'TypeReference',
              value,
              isRequired: this.isRequired(),
            });
          }
          break;
        }
        case '{': {
          fields.push({
            type: 'ObjectField',
            name,
            ...this.simpleObjectOrTypeReference(),
            isRequired: this.isRequired(),
          });
          break;
        }
        case '[': {
          fields.push({
            type: 'ObjectField',
            name,
            ...this.simpleObjectOrTypeReference(),
            isRequired: this.isRequired(),
          });
          break;
        }
      }
    }
    this.eat('}');
    return {
      variableType: 'Object',
      fields,
    };
  }

  private Responses(): ApiResponseDefinition[] {
    if (this.lookahead.type !== 'API_STATUS') {
      this.reportAndExit(this.lookahead, 'Expected a HTTP status code');
    }
    const responses: ApiResponseDefinition[] = [];
    while (this.lookahead.type === 'API_STATUS') {
      const status = Number(this.lookahead.value.slice(0, -1));
      this.eat('API_STATUS');
      this.eat('{');

      let body: BodyType | undefined = undefined;
      let headers: HeaderType | undefined = undefined;
      while (['API_BODY', 'API_HEADERS'].includes(this.lookahead.type)) {
        if ((this.lookahead as Token).type === 'API_BODY') {
          this.eat('API_BODY');
          body = this.simpleObjectOrTypeReference();
        }

        if ((this.lookahead as Token).type === 'API_HEADERS') {
          this.eat('API_HEADERS');
          headers = this.simpleObjectOrTypeReference() as HeaderType; // could possible be invalid but will be after the whole AST is parsed
        }
      }

      if ((this.lookahead as Token).type === '!') {
        this.reportAndExit(
          this.lookahead,
          '! is not allowed because `body` or `headers` are always required if specified',
        );
      }
      this.eat('}');

      responses.push({
        type: 'ApiResponseDefinition',
        status,
        body,
        headers,
      });
    }
    return responses;
  }

  private eat(tokenType: Token['type']) {
    const token = this.lookahead;
    if (token.type === 'EOF') {
      this.reportAndExit(this.lookahead, `Reached EOF, expected ${tokenType}`);
    }
    if (token.type !== tokenType) {
      this.reportAndExit(this.lookahead, `Expected ${tokenType}`);
    }
    this.lookahead = this.tokenizer.getNextToken();
    return token;
  }
}
