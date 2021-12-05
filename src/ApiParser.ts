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
export type TypeReference = { variableType: 'TypeReference'; value: string };
export type Builtin =
  | IntVariable
  | FloatVariable
  | StringVariable
  | BooleanVariable
  | IntLiteral
  | FloatLiteral
  | StringLiteral
  | BooleanLiteral
  | TypeReference;

export type ObjectField = {
  type: 'ObjectField';
  name: string;
  isRequired: boolean;
} & (Builtin | UnionVariable | ArrayVariable | ObjectVariable);

export type ObjectVariable = { variableType: 'Object'; fields: ObjectField[] };

export type UnionItem = {
  type: 'UnionItem';
} & (Builtin | ObjectVariable);

export type UnionVariable = {
  variableType: 'Union';
  unions: UnionItem[];
};

export type ArrayItem = {
  isRequired: boolean;
} & Builtin;
export type ArrayVariable = { variableType: 'Array'; items: ArrayItem };

export type ApiFieldDefinition = {
  type: 'ApiFieldDefinition';
} & (ObjectVariable | ArrayVariable | TypeReference);

export type ApiResponseDefinition = {
  type: 'ApiResponseDefinition';
  status: number;
  body?: ApiFieldDefinition;
  headers?: ApiFieldDefinition;
};

export type ParamsField = {
  type: 'ParamsField';
  name: string;
} & (IntVariable | FloatVariable | StringVariable);

export type ApiParamsDefinition = {
  type: 'ParamsDefinition';
  fields: ParamsField[];
};

export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'HEAD';
export type ApiDefinition = {
  type: 'ApiDefinition';
  name: string;
  method: ApiMethod;
  path: string;
  params?: ApiParamsDefinition;
  query?: ApiFieldDefinition;
  body?: ApiFieldDefinition;
  headers?: ApiFieldDefinition;
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

const getArrayItem = (value: string, isRequired: boolean): ArrayItem => {
  if (isBuiltIn(value)) {
    return {
      variableType: value,
      isRequired,
    };
  }
  return {
    variableType: 'TypeReference',
    value,
    isRequired,
  };
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
      return {
        type: 'TypeDeclaration',
        name: value.replace('type ', ''),
        variableType: 'Object',
        fields: this.Fields(),
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
        unions.push({
          type: 'UnionItem',
          variableType: 'Object',
          fields: this.Fields(),
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
    let params: ApiParamsDefinition | undefined = undefined;
    const paramFields: ParamsField[] = [];

    while (['API_PATH_INT', 'API_PATH_FLOAT', 'API_PATH_STRING', 'API_PATH_SEGMENT'].includes(this.lookahead.type)) {
      if (this.lookahead.type === 'API_PATH_SEGMENT') {
        path += this.lookahead.value;
        this.eat('API_PATH_SEGMENT');
      } else if (this.lookahead.type === 'API_PATH_STRING') {
        path += this.lookahead.value;
        paramFields.push({
          type: 'ParamsField',
          name: this.lookahead.value.replace('/:', ''),
          variableType: 'String',
        });
        this.eat('API_PATH_STRING');
      } else if (this.lookahead.type === 'API_PATH_INT') {
        const name = this.lookahead.value.replace(/\/:(\w+)\(Int\)/, '$1');
        path += `/:${name}`;
        paramFields.push({
          type: 'ParamsField',
          name: name,
          variableType: 'Int',
        });
        this.eat('API_PATH_INT');
      } else if (this.lookahead.type === 'API_PATH_FLOAT') {
        const name = this.lookahead.value.replace(/\/:(\w+)\(Float\)/, '$1');
        path += `/:${name}`;
        paramFields.push({
          type: 'ParamsField',
          name,
          variableType: 'Float',
        });
        this.eat('API_PATH_FLOAT');
      }
    }
    if (paramFields.length > 0) {
      params = {
        type: 'ParamsDefinition',
        fields: paramFields,
      };
    }

    if (path === '') {
      this.reportAndExit(this.lookahead, 'Expected a path /foo');
    }

    this.eat('{');

    let query = undefined;
    let body = undefined;
    let headers = undefined;

    while (this.lookahead.type && ['API_QUERY', 'API_BODY', 'API_HEADERS'].includes(this.lookahead.type)) {
      if ((this.lookahead as Token).type === 'API_QUERY') {
        this.eat('API_QUERY');
        query = this.ApiFieldDefinition();
      }

      if ((this.lookahead as Token).type === 'API_BODY') {
        this.eat('API_BODY');
        body = this.ApiFieldDefinition();
      }

      if ((this.lookahead as Token).type === 'API_HEADERS') {
        this.eat('API_HEADERS');
        headers = this.ApiFieldDefinition();
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

  private ApiFieldDefinition(): ApiFieldDefinition {
    if (this.lookahead.type === '{') {
      return {
        type: 'ApiFieldDefinition',
        variableType: 'Object',
        fields: this.Fields(),
      } as const;
    } else if (this.lookahead.type === 'VARIABLE_TYPE' || this.lookahead.type === '[') {
      if (this.lookahead.type === '[') {
        this.eat('[');

        const variableType = this.lookahead.value;
        this.eat('VARIABLE_TYPE');

        const isItemRequired = (this.lookahead as Token).type === '!';
        if (isItemRequired) {
          this.eat('!');
        }

        this.eat(']');

        return {
          type: 'ApiFieldDefinition',
          variableType: 'Array',
          items: getArrayItem(variableType, isItemRequired),
        } as const;
      }
      const value = this.lookahead.value;
      if (value === undefined) {
        this.reportAndExit(this.lookahead, 'Unsupported FieldReference value');
      }
      this.eat('VARIABLE_TYPE');
      const result = {
        type: 'ApiFieldDefinition',
        variableType: 'TypeReference',
        value,
      } as const;
      if (this.lookahead.value === '!') {
        this.reportAndExit(
          this.lookahead,
          '! is not allowed because `params`, `body`, `query` or `headers` are always required if specified',
        );
      }
      return result;
    } else {
      this.reportAndExit(this.lookahead, 'Unsupported token found in ApiFieldDefinition');
    }
  }

  private Fields(): ObjectField[] {
    this.eat('{');
    const variables: ObjectField[] = [];
    while (this.lookahead.type === 'WORD_WITH_COLON') {
      const name = this.lookahead.value.slice(0, -1);
      this.eat('WORD_WITH_COLON');

      if ((this.lookahead as Token).type === '[') {
        this.eat('[');

        const variableType = this.lookahead.value;
        this.eat('VARIABLE_TYPE');

        const isItemRequired = (this.lookahead as Token).type === '!';
        if (isItemRequired) {
          this.eat('!');
        }
        this.eat(']');

        const isRequired = (this.lookahead as Token).type === '!';
        if (isRequired) {
          this.eat('!');
        }

        variables.push({
          type: 'ObjectField',
          name,
          variableType: 'Array',
          isRequired,
          items: getArrayItem(variableType, isItemRequired),
        });
      } else if (
        this.lookahead &&
        ['VARIABLE_TYPE', 'STRING_LITERAL', 'BOOLEAN_LITERAL', 'INT_LITERAL', 'FLOAT_LITERAL'].includes(
          this.lookahead.type,
        )
      ) {
        const value = this.lookahead.value;
        if ((this.lookahead as Token).type === 'VARIABLE_TYPE') {
          this.eat('VARIABLE_TYPE');
          const isRequired = (this.lookahead as Token).type === '!';
          if (isRequired) {
            this.eat('!');
          }
          if (isBuiltIn(value)) {
            variables.push({
              type: 'ObjectField',
              name,
              variableType: value,
              isRequired,
            });
          } else {
            variables.push({
              type: 'ObjectField',
              name,
              variableType: 'TypeReference',
              value: value,
              isRequired,
            });
          }
        } else if ((this.lookahead as Token).type === 'STRING_LITERAL') {
          this.eat('STRING_LITERAL');
          const isRequired = (this.lookahead as Token).type === '!';
          if (isRequired) {
            this.eat('!');
          }
          variables.push({
            type: 'ObjectField',
            name,
            variableType: 'StringLiteral',
            value: value.slice(0, -1).slice(1),
            isRequired,
          });
        } else if ((this.lookahead as Token).type === 'BOOLEAN_LITERAL') {
          this.eat('BOOLEAN_LITERAL');
          const isRequired = (this.lookahead as Token).type === '!';
          if (isRequired) {
            this.eat('!');
          }
          variables.push({
            type: 'ObjectField',
            name,
            variableType: 'BooleanLiteral',
            value: value === 'true',
            isRequired,
          });
        } else if ((this.lookahead as Token).type === 'INT_LITERAL') {
          this.eat('INT_LITERAL');
          const isRequired = (this.lookahead as Token).type === '!';
          if (isRequired) {
            this.eat('!');
          }

          variables.push({
            type: 'ObjectField',
            name,
            variableType: 'IntLiteral',
            value: Number(value),
            isRequired,
          });
        } else if ((this.lookahead as Token).type === 'FLOAT_LITERAL') {
          this.eat('FLOAT_LITERAL');
          const isRequired = (this.lookahead as Token).type === '!';
          if (isRequired) {
            this.eat('!');
          }

          variables.push({
            type: 'ObjectField',
            name,
            variableType: 'FloatLiteral',
            value: Number(value),
            isRequired,
          });
        } else {
          this.reportAndExit(this.lookahead, 'Unexpected token found in Object field');
        }
      } else if ((this.lookahead as Token).type === '{') {
        // nested field
        const fields = this.Fields();
        const isRequired = (this.lookahead as Token).type === '!';
        if (isRequired) {
          this.eat('!');
        }
        variables.push({
          type: 'ObjectField',
          name,
          variableType: 'Object',
          fields,
          isRequired,
        });
      } else if ((this.lookahead as Token).type === '|') {
        // union field
        const unions = this.Unions();
        const isRequired = (this.lookahead as Token).type === '!';
        if (isRequired) {
          this.eat('!');
        }
        variables.push({
          type: 'ObjectField',
          name,
          variableType: 'Union',
          unions,
          isRequired,
        });
      } else {
        this.reportAndExit(this.lookahead, 'Unexpected field variable found');
      }
    }
    this.eat('}');
    return variables;
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

      let body = undefined;
      let headers = undefined;
      while (['API_BODY', 'API_HEADERS'].includes(this.lookahead.type)) {
        if ((this.lookahead as Token).type === 'API_BODY') {
          this.eat('API_BODY');
          body = this.ApiFieldDefinition();
        }

        if ((this.lookahead as Token).type === 'API_HEADERS') {
          this.eat('API_HEADERS');
          headers = this.ApiFieldDefinition();
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
