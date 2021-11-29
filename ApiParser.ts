import ApiTokenizer, { Token } from "./ApiTokenizer";

export default class ApiParser {
  private tokenizer: ApiTokenizer;
  private lookahead: Token;

  parse(str: string) {
    this.tokenizer = new ApiTokenizer(str);

    this.lookahead = this.tokenizer.getNextToken();
    return this.Document();
  }

  Document() {
    return {
      type: "Program",
      definitions: this.Definitions(),
    };
  }

  Definitions() {
    const definitions = [];
    while (
      this.lookahead?.type === "WORD_WITH_COLON" ||
      this.lookahead?.type === "TYPE_DECLARATION"
    ) {
      if (this.lookahead.type === "WORD_WITH_COLON") {
        definitions.push(this.ApiDefinition());
      } else if (this.lookahead.type === "TYPE_DECLARATION") {
        definitions.push(this.TypeDeclaration());
      } else {
        throw new SyntaxError(
          `TypeDefinition or ApiDefinition required on top-level got ${this.lookahead.type}`
        );
      }
    }
    if (this.lookahead && this.lookahead.type !== null) {
      throw new SyntaxError(
        `TypeDefinition or ApiDefinition required on top-level got token '${this.lookahead.type}'`
      );
    }
    return definitions;
  }

  TypeDeclaration() {
    const value = this.lookahead?.value;
    if (!value) {
      throw new SyntaxError("TypeDeclaration expected `value`");
    }
    this.eat("TYPE_DECLARATION");
    if (this.lookahead?.type === "{") {
      return {
        type: "TypeDeclaration",
        name: value.replace("type ", ""),
        fields: this.Fields(),
      };
    } else if (this.lookahead?.type === "|") {
      return {
        type: "UnionDeclaration",
        name: value.replace("type ", ""),
        unions: this.Unions(),
      };
    } else {
      throw new SyntaxError(
        `Unsupported token found in TypeDeclaration: '${this.lookahead?.type}'`
      );
    }
  }

  Unions() {
    const unions: (
      | {
          type: "UnionItem";
          variableType: string;
        }
      | {
          type: "UnionItem";
          variableType: number;
        }
      | {
          type: "UnionItem";
          variableType: "AnonymousTypeDeclaration";
          fields: ReturnType<ApiParser["Fields"]>;
        }
    )[] = [];

    while (this.lookahead?.type === "|") {
      this.eat("|");

      const variableType = this.lookahead.value;
      if ((this.lookahead as Token)?.type === "STRING") {
        this.eat("STRING");
        unions.push({ type: "UnionItem", variableType });
      } else if ((this.lookahead as Token)?.type === "NUMBER") {
        this.eat("NUMBER");
        unions.push({ type: "UnionItem", variableType: Number(variableType) });
      } else if ((this.lookahead as Token)?.type === "VariableType") {
        this.eat("VariableType");
        unions.push({ type: "UnionItem", variableType });
      } else if ((this.lookahead as Token)?.type === "{") {
        unions.push({
          type: "UnionItem",
          variableType: "AnonymousTypeDeclaration",
          fields: this.Fields(),
        });
      }
    }
    return unions;
  }

  ApiDefinition() {
    const name = this.lookahead?.value.slice(0, -1);
    if (name === undefined) {
      throw new SyntaxError("Unexpected name");
    }
    this.eat("WORD_WITH_COLON");

    const method = this.lookahead?.value;
    if (method === undefined) {
      throw new SyntaxError("Unexpected method");
    }
    this.eat("API_METHOD");

    const path = this.lookahead?.value;
    if (path === undefined) {
      throw new SyntaxError("Unexpected path");
    }
    this.eat("API_PATH");

    this.eat("{");
    let params = undefined;
    if (this.lookahead?.type === "API_PARAMS") {
      this.eat("API_PARAMS");
      params = this.ApiFieldDefinition();
    }

    let query = undefined;
    if (this.lookahead?.type === "API_QUERY") {
      this.eat("API_QUERY");
      query = this.ApiFieldDefinition();
    }

    let body = undefined;
    if (this.lookahead?.type === "API_BODY") {
      this.eat("API_BODY");
      body = this.ApiFieldDefinition();
    }

    const responses = this.Responses();
    this.eat("}");

    return {
      type: "ApiDefinition",
      name,
      method,
      path,
      params,
      query,
      body,
      responses,
    } as const;
  }

  private ApiFieldDefinition() {
    if (this.lookahead?.type === "{") {
      return {
        type: "ApiFieldDefinition",
        variableType: "AnonymousTypeDeclaration",
        fields: this.Fields(),
      } as const;
    } else if (
      this.lookahead?.type === "VariableType" ||
      this.lookahead?.type === "["
    ) {
      return {
        type: "ApiFieldDefinition",
        ...this.parseFieldReference(),
      } as const;
    } else {
      throw new SyntaxError(
        `Unsupported token found in ApiFieldDefinition: '${this.lookahead?.type}'`
      );
    }
  }

  private parseFieldReference() {
    if (this.lookahead?.type === "[") {
      this.eat("[");

      const variableType = this.lookahead.value;
      this.eat("VariableType");

      const isItemRequired = (this.lookahead as Token)?.type === "!";
      if (isItemRequired) {
        this.eat("!");
      }

      this.eat("]");

      return {
        variableType: "Array",
        item: {
          variableType,
          isRequired: isItemRequired,
        },
      } as const;
    } else {
      const variableType = this.lookahead?.value;
      if (variableType === undefined) {
        throw new SyntaxError("Could not parse FieldReference value");
      }
      this.eat("VariableType");

      return {
        variableType,
      } as const;
    }
  }

  private Fields() {
    this.eat("{");
    const variables: (
      | {
          type: "FieldDefinition";
          id: string;
          variableType: "AnonymousTypeDeclaration";
          isRequired: boolean;
          fields: ReturnType<ApiParser["Fields"]>;
        }
      | {
          type: "FieldDefinition";
          id: string;
          variableType: "Array";
          isRequired: boolean;
          item: ArrayItem;
        }
      | {
          type: "FieldDefinition";
          id: string;
          variableType: string | number;
          isRequired: boolean;
        }
      | {
          type: "FieldDefinition";
          id: string;
          variableType: "UnionDeclaration";
          isRequired: boolean;
          unions: ReturnType<ApiParser["Unions"]>;
        }
    )[] = [];
    while (this.lookahead?.type === "WORD_WITH_COLON") {
      const id = this.lookahead.value.slice(0, -1);
      this.eat("WORD_WITH_COLON");

      if ((this.lookahead as Token)?.type === "[") {
        this.eat("[");

        const variableType = this.lookahead.value;
        this.eat("VariableType");

        const isItemRequired = (this.lookahead as Token)?.type === "!";
        if (isItemRequired) {
          this.eat("!");
        }
        this.eat("]");

        const isRequired = (this.lookahead as Token)?.type === "!";
        if (isRequired) {
          this.eat("!");
        }

        variables.push({
          type: "FieldDefinition",
          id,
          variableType: "Array",
          isRequired,
          item: {
            variableType,
            isRequired: isItemRequired,
          },
        });
      } else if (
        this.lookahead &&
        ["VariableType", "STRING", "NUMBER"].includes(this.lookahead.type)
      ) {
        let variableType: string | number = this.lookahead.value;
        if ((this.lookahead as Token)?.type === "VariableType") {
          this.eat("VariableType");
        } else if ((this.lookahead as Token)?.type === "STRING") {
          this.eat("STRING");
        } else if ((this.lookahead as Token)?.type === "NUMBER") {
          variableType = Number(variableType);
          this.eat("NUMBER");
        } else {
          throw new SyntaxError(
            `Unsupported token type in fields '${this.lookahead.type}'`
          );
        }

        const isRequired = (this.lookahead as Token)?.type === "!";
        if (isRequired) {
          this.eat("!");
        }

        variables.push({
          type: "FieldDefinition",
          id,
          variableType,
          isRequired,
        });
      } else if ((this.lookahead as Token)?.type === "{") {
        // nested field
        const fields = this.Fields();
        const isRequired = (this.lookahead as Token)?.type === "!";
        if (isRequired) {
          this.eat("!");
        }
        variables.push({
          type: "FieldDefinition",
          id,
          variableType: "AnonymousTypeDeclaration",
          fields,
          isRequired,
        } as const);
      } else if ((this.lookahead as Token)?.type === "|") {
        // union field
        const unions = this.Unions();
        const isRequired = (this.lookahead as Token)?.type === "!";
        if (isRequired) {
          this.eat("!");
        }
        variables.push({
          type: "FieldDefinition",
          id,
          variableType: "UnionDeclaration",
          unions,
          isRequired,
        });
      } else {
        throw new SyntaxError(
          `Unsupported token found in Fields: '${this.lookahead.type}'`
        );
      }
    }
    this.eat("}");
    return variables;
  }

  private Responses() {
    if (this.lookahead?.type !== "API_STATUS") {
      throw new SyntaxError(
        `Expected a HTTP Status Code. Got "${this.lookahead?.value}"`
      );
    }
    const responses = [];
    while (this.lookahead.type === "API_STATUS") {
      const value = Number(this.lookahead.value.slice(0, -1));
      this.eat("API_STATUS");
      responses.push({
        status: value,
        body: this.ApiFieldDefinition(),
      } as const);
    }
    return responses;
  }

  private eat(tokenType: string) {
    const token = this.lookahead;
    if (token === null) {
      throw new SyntaxError(
        `Unexpected end of input, expected: "${tokenType}"`
      );
    }
    if (token.type !== tokenType) {
      throw new SyntaxError(
        `Unexpected token: "${token.value}", expected: "${tokenType}"`
      );
    }
    this.lookahead = this.tokenizer.getNextToken();
    return token;
  }
}

export type ArrayItem = {
  variableType: string;
  isRequired: boolean;
};
export type Ast = ReturnType<ApiParser["Document"]>;
export type ApiDefinition = ReturnType<ApiParser["ApiDefinition"]>;
export type ApiFieldDefinition = ReturnType<ApiParser["ApiFieldDefinition"]>;
export type Field = ReturnType<ApiParser["Fields"]>[0];
export type Union = ReturnType<ApiParser["Unions"]>[0];
export type TypeDeclaration = ReturnType<ApiParser["TypeDeclaration"]>;
