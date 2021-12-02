import ApiTokenizer, { Token } from './ApiTokenizer';

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

export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'HEAD';
export type ApiDefinition = {
  type: 'ApiDefinition';
  name: string;
  method: ApiMethod;
  path: string;
  params?: ApiFieldDefinition;
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

  parse(str: string): Ast {
    this.tokenizer = new ApiTokenizer(str);

    this.lookahead = this.tokenizer.getNextToken();
    return this.Document();
  }

  Document(): Ast {
    return {
      type: 'Document',
      definitions: this.Definitions(),
    };
  }

  Definitions(): Definition[] {
    const definitions: (TypeDeclaration | ApiDefinition)[] = [];
    while (this.lookahead?.type === 'WORD_WITH_COLON' || this.lookahead?.type === 'TYPE_DECLARATION') {
      if (this.lookahead.type === 'WORD_WITH_COLON') {
        definitions.push(this.ApiDefinition());
      } else if (this.lookahead.type === 'TYPE_DECLARATION') {
        definitions.push(this.TypeDeclaration());
      } else {
        throw new SyntaxError(`TypeDefinition or ApiDefinition required on top-level got ${this.lookahead.type}`);
      }
    }
    if (this.lookahead && this.lookahead.type !== null) {
      throw new SyntaxError(`TypeDefinition or ApiDefinition required on top-level got token '${this.lookahead.type}'`);
    }
    return definitions;
  }

  TypeDeclaration(): TypeDeclaration {
    const value = this.lookahead?.value;
    if (!value) {
      throw new SyntaxError('TypeDeclaration expected `value`');
    }
    this.eat('TYPE_DECLARATION');
    if (this.lookahead?.type === '{') {
      return {
        type: 'TypeDeclaration',
        name: value.replace('type ', ''),
        variableType: 'Object',
        fields: this.Fields(),
      };
    } else if (this.lookahead?.type === '|') {
      return {
        type: 'TypeDeclaration',
        name: value.replace('type ', ''),
        variableType: 'Union',
        unions: this.Unions(),
      };
    } else {
      throw new SyntaxError(`Unsupported token found in TypeDeclaration: '${this.lookahead?.type}'`);
    }
  }

  Unions(): UnionItem[] {
    const unions: UnionItem[] = [];

    while (this.lookahead?.type === '|') {
      this.eat('|');

      const value = this.lookahead.value;
      if ((this.lookahead as Token)?.type === 'STRING_LITERAL') {
        this.eat('STRING_LITERAL');
        unions.push({
          type: 'UnionItem',
          variableType: 'StringLiteral',
          value: value.slice(0, -1).slice(1),
        });
      } else if ((this.lookahead as Token)?.type === 'BOOLEAN_LITERAL') {
        this.eat('BOOLEAN_LITERAL');
        unions.push({
          type: 'UnionItem',
          variableType: 'BooleanLiteral',
          value: value === 'true',
        });
      } else if ((this.lookahead as Token)?.type === 'INT_LITERAL') {
        this.eat('INT_LITERAL');
        unions.push({
          type: 'UnionItem',
          variableType: 'IntLiteral',
          value: Number(value),
        });
      } else if ((this.lookahead as Token)?.type === 'FLOAT_LITERAL') {
        this.eat('FLOAT_LITERAL');
        unions.push({
          type: 'UnionItem',
          variableType: 'FloatLiteral',
          value: Number(value),
        });
      } else if ((this.lookahead as Token)?.type === 'VARIABLE_TYPE') {
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
      } else if ((this.lookahead as Token)?.type === '{') {
        unions.push({
          type: 'UnionItem',
          variableType: 'Object',
          fields: this.Fields(),
        });
      }
    }
    return unions;
  }

  ApiDefinition(): ApiDefinition {
    const name = this.lookahead?.value.slice(0, -1);
    if (name === undefined) {
      throw new SyntaxError('Unexpected name');
    }
    this.eat('WORD_WITH_COLON');

    const method = this.lookahead?.value
      ? isApiMethod(this.lookahead.value)
        ? this.lookahead.value
        : undefined
      : undefined;
    if (method === undefined) {
      throw new SyntaxError(`Unexpected method value ${method}`);
    }
    this.eat('API_METHOD');

    const path = this.lookahead?.value;
    if (path === undefined) {
      throw new SyntaxError('Unexpected path');
    }
    this.eat('API_PATH');

    this.eat('{');

    let params = undefined;
    let query = undefined;
    let body = undefined;
    let headers = undefined;

    while (
      this.lookahead?.type &&
      ['API_PARAMS', 'API_QUERY', 'API_BODY', 'API_HEADERS'].includes(this.lookahead.type)
    ) {
      if (this.lookahead.type === 'API_PARAMS') {
        this.eat('API_PARAMS');
        params = this.ApiFieldDefinition();
      }

      if (this.lookahead.type === 'API_QUERY') {
        this.eat('API_QUERY');
        query = this.ApiFieldDefinition();
      }

      if (this.lookahead.type === 'API_BODY') {
        this.eat('API_BODY');
        body = this.ApiFieldDefinition();
      }

      if (this.lookahead.type === 'API_HEADERS') {
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
    if (this.lookahead?.type === '{') {
      return {
        type: 'ApiFieldDefinition',
        variableType: 'Object',
        fields: this.Fields(),
      };
    } else if (this.lookahead?.type === 'VARIABLE_TYPE' || this.lookahead?.type === '[') {
      if (this.lookahead.type === '[') {
        this.eat('[');

        const variableType = this.lookahead.value;
        this.eat('VARIABLE_TYPE');

        const isItemRequired = (this.lookahead as Token)?.type === '!';
        if (isItemRequired) {
          this.eat('!');
        }

        this.eat(']');

        return {
          type: 'ApiFieldDefinition',
          variableType: 'Array',
          items: getArrayItem(variableType, isItemRequired),
        };
      }
      const value = this.lookahead?.value;
      if (value === undefined) {
        throw new SyntaxError('Could not parse FieldReference value');
      }
      this.eat('VARIABLE_TYPE');
      return {
        type: 'ApiFieldDefinition',
        variableType: 'TypeReference',
        value,
      };
    } else {
      throw new SyntaxError(`Unsupported token found in ApiFieldDefinition: '${this.lookahead?.type}'`);
    }
  }

  private Fields(): ObjectField[] {
    this.eat('{');
    const variables: ObjectField[] = [];
    while (this.lookahead?.type === 'WORD_WITH_COLON') {
      const name = this.lookahead.value.slice(0, -1);
      this.eat('WORD_WITH_COLON');

      if ((this.lookahead as Token)?.type === '[') {
        this.eat('[');

        const variableType = this.lookahead.value;
        this.eat('VARIABLE_TYPE');

        const isItemRequired = (this.lookahead as Token)?.type === '!';
        if (isItemRequired) {
          this.eat('!');
        }
        this.eat(']');

        const isRequired = (this.lookahead as Token)?.type === '!';
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
        let value = this.lookahead.value;
        if ((this.lookahead as Token)?.type === 'VARIABLE_TYPE') {
          this.eat('VARIABLE_TYPE');
          const isRequired = (this.lookahead as Token)?.type === '!';
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
        } else if ((this.lookahead as Token)?.type === 'STRING_LITERAL') {
          this.eat('STRING_LITERAL');
          const isRequired = (this.lookahead as Token)?.type === '!';
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
        } else if ((this.lookahead as Token)?.type === 'BOOLEAN_LITERAL') {
          this.eat('BOOLEAN_LITERAL');
          const isRequired = (this.lookahead as Token)?.type === '!';
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
        } else if ((this.lookahead as Token)?.type === 'INT_LITERAL') {
          this.eat('INT_LITERAL');
          const isRequired = (this.lookahead as Token)?.type === '!';
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
        } else if ((this.lookahead as Token)?.type === 'FLOAT_LITERAL') {
          this.eat('FLOAT_LITERAL');
          const isRequired = (this.lookahead as Token)?.type === '!';
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
          throw new SyntaxError(`Unsupported token type in fields '${this.lookahead.type}'`);
        }
      } else if ((this.lookahead as Token)?.type === '{') {
        // nested field
        const fields = this.Fields();
        const isRequired = (this.lookahead as Token)?.type === '!';
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
      } else if ((this.lookahead as Token)?.type === '|') {
        // union field
        const unions = this.Unions();
        const isRequired = (this.lookahead as Token)?.type === '!';
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
        throw new SyntaxError(`Unsupported token found in Fields: '${this.lookahead.type}'`);
      }
    }
    this.eat('}');
    return variables;
  }

  private Responses(): ApiResponseDefinition[] {
    if (this.lookahead?.type !== 'API_STATUS') {
      throw new SyntaxError(`Expected a HTTP Status Code. Got "${this.lookahead?.value}"`);
    }
    const responses: ApiResponseDefinition[] = [];
    while (this.lookahead.type === 'API_STATUS') {
      const value = Number(this.lookahead.value.slice(0, -1));
      this.eat('API_STATUS');
      this.eat('{');

      let body = undefined;
      let headers = undefined;
      while (['API_BODY', 'API_HEADERS'].includes(this.lookahead.type)) {
        if ((this.lookahead as Token)?.type === 'API_BODY') {
          this.eat('API_BODY');
          body = this.ApiFieldDefinition();
        }

        if ((this.lookahead as Token)?.type === 'API_HEADERS') {
          this.eat('API_HEADERS');
          headers = this.ApiFieldDefinition();
        }
      }
      this.eat('}');

      responses.push({
        type: 'ApiResponseDefinition',
        status: value,
        body,
        headers,
      });
    }
    return responses;
  }

  private eat(tokenType: string) {
    const token = this.lookahead;
    if (token === null) {
      throw new SyntaxError(`Unexpected end of input, expected: "${tokenType}"`);
    }
    if (token.type !== tokenType) {
      throw new SyntaxError(`Unexpected token: "${token.value}", expected: "${tokenType}"`);
    }
    this.lookahead = this.tokenizer.getNextToken();
    return token;
  }
}
