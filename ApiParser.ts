import ApiTokenizer from "./ApiTokenizer";

export default class ApiParser {
  private tokenizer: ApiTokenizer;
  private lookahead: any;

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
    const value = this.lookahead.value;
    this.eat("TYPE_DECLARATION");
    if (this.lookahead.type === "{") {
      return {
        type: "TypeDeclaration",
        name: value.replace("type ", ""),
        fields: this.Fields(),
      };
    } else if (this.lookahead.type === "|") {
      return {
        type: "UnionDeclaration",
        name: value.replace("type ", ""),
        unions: this.Unions(),
      };
    } else {
      throw new SyntaxError(
        `Unsupported token found in TypeDeclaration: '${this.lookahead.type}'`
      );
    }
  }

  Unions() {
    const unions = [];
    while (this.lookahead.type === "|") {
      this.eat("|");

      const variableType = this.lookahead.value;
      if (this.lookahead.type === "STRING") {
        this.eat("STRING");
        unions.push({ type: "UnionItem", variableType });
      } else if (this.lookahead.type === "NUMBER") {
        this.eat("NUMBER");
        unions.push({ type: "UnionItem", variableType: Number(variableType) });
      } else if (this.lookahead.type === "VariableType") {
        this.eat("VariableType");
        unions.push({ type: "UnionItem", variableType });
      } else if (this.lookahead.type === "{") {
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
    const name = this.lookahead.value.slice(0, -1);
    this.eat("WORD_WITH_COLON");

    const method = this.lookahead.value;
    this.eat("API_METHOD");

    const path = this.lookahead.value;
    this.eat("API_PATH");

    this.eat("{");
    let params = undefined;
    if (this.lookahead.type === "API_PARAMS") {
      this.eat("API_PARAMS");
      params = this.Type();
    }

    let query = undefined;
    if (this.lookahead.type === "API_QUERY") {
      this.eat("API_QUERY");
      query = this.Type();
    }

    let body = undefined;
    if (this.lookahead.type === "API_BODY") {
      this.eat("API_BODY");
      body = this.Type();
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
    };
  }

  private Type() {
    if (this.lookahead.type === "{") {
      return {
        type: "AnonymousTypeDeclaration",
        fields: this.Fields(),
      };
    } else if (
      this.lookahead.type === "VariableType" ||
      this.lookahead.type === "["
    ) {
      return this.TypeReference();
    } else {
      throw new SyntaxError(
        `Unsupported token found in Type: '${this.lookahead.type}'`
      );
    }
  }

  private TypeReference() {
    if (this.lookahead.type === "[") {
      this.eat("[");

      const variableType = this.lookahead.value;
      this.eat("VariableType");

      const isItemRequired = this.lookahead.type === "!";
      if (isItemRequired) {
        this.eat("!");
      }

      this.eat("]");

      const isRequired = this.lookahead.type === "!";
      if (isRequired) {
        this.eat("!");
      }

      return {
        type: "TypeReference",
        variableType: "Array",
        isRequired,
        item: {
          variableType,
          isRequired: isItemRequired,
        },
      };
    } else {
      const variableType = this.lookahead.value;
      this.eat("VariableType");

      const isRequired = this.lookahead.type === "!";
      if (isRequired) {
        this.eat("!");
      }
      return {
        type: "TypeReference",
        variableType,
        isRequired,
      };
    }
  }

  private Fields() {
    this.eat("{");
    const variables = [];
    while (this.lookahead.type === "WORD_WITH_COLON") {
      const id = this.lookahead.value.slice(0, -1);
      this.eat("WORD_WITH_COLON");

      if (this.lookahead.type === "[") {
        this.eat("[");

        const variableType = this.lookahead.value;
        this.eat("VariableType");

        const isItemRequired = this.lookahead.type === "!";
        if (isItemRequired) {
          this.eat("!");
        }
        this.eat("]");

        const isRequired = this.lookahead.type === "!";
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
        this.lookahead.type === "VariableType" ||
        this.lookahead.type === "STRING" ||
        this.lookahead.type === "NUMBER"
      ) {
        let variableType = this.lookahead.value;
        if (this.lookahead.type === "VariableType") {
          this.eat("VariableType");
        } else if (this.lookahead.type === "STRING") {
          this.eat("STRING");
        } else if (this.lookahead.type === "NUMBER") {
          variableType = Number(variableType);
          this.eat("NUMBER");
        } else {
          throw new SyntaxError(
            `Unsupported token type in fields '${this.lookahead.type}'`
          );
        }

        const isRequired = this.lookahead.type === "!";
        if (isRequired) {
          this.eat("!");
        }

        variables.push({
          type: "FieldDefinition",
          id,
          variableType,
          isRequired,
        });
      } else if (this.lookahead.type === "{") {
        // nested field
        const fields = this.Fields();
        const isRequired = this.lookahead.type === "!";
        if (isRequired) {
          this.eat("!");
        }
        variables.push({
          type: "FieldDefinition",
          id,
          variableType: "AnonymousTypeDeclaration",
          fields,
          isRequired,
        });
      } else if (this.lookahead.type === "|") {
        // nested field
        const unions = this.Unions();
        const isRequired = this.lookahead.type === "!";
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
    if (this.lookahead.type !== "API_STATUS") {
      throw new SyntaxError(
        `Expected a HTTP Status Code. Got "${this.lookahead.value}"`
      );
    }
    const responses = [];
    while (this.lookahead.type === "API_STATUS") {
      const value = Number(this.lookahead.value.slice(0, -1));
      this.eat("API_STATUS");
      responses.push({
        status: value,
        body: this.Type(),
      });
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
