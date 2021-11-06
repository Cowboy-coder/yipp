import ApiTokenizer from "./ApiTokenizer";

export default class ApiParser {
  private tokenizer = new ApiTokenizer();
  private lookahead: any;

  parse(str: string) {
    this.tokenizer.init(str);

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
      this.lookahead?.type === "API_METHOD" ||
      this.lookahead?.type === "TYPE_DECLARATION"
    ) {
      if (this.lookahead.type === "API_METHOD") {
        definitions.push(this.ApiDefinition());
      } else if (this.lookahead.type === "TYPE_DECLARATION") {
        definitions.push(this.TypeDeclaration());
      } else {
        throw new SyntaxError(
          "TypeDefinition or ApiDefinition required on top-level"
        );
      }
    }
    return definitions;
  }

  TypeDeclaration() {
    const value = this.lookahead.value;
    this.eat("TYPE_DECLARATION");
    return {
      type: "TypeDeclaration",
      name: value.replace("type ", ""),
      fields: this.Fields(),
    };
  }

  ApiDefinition() {
    const method = this.lookahead.value;
    this.eat("API_METHOD");

    const path = this.lookahead.value;
    this.eat("API_PATH");

    this.eat("{");
    let params = null;
    if (this.lookahead.type === "API_PARAMS") {
      this.eat("API_PARAMS");
      params = this.Type();
    }

    let query = null;
    if (this.lookahead.type === "API_QUERY") {
      this.eat("API_QUERY");
      query = this.Type();
    }

    let body = null;
    if (this.lookahead.type === "API_BODY") {
      this.eat("API_BODY");
      body = this.Type();
    }

    const responses = this.Responses();
    this.eat("}");

    return {
      type: "ApiDefinition",
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
    } else if (this.lookahead.type === "VariableType") {
      return this.TypeReference();
    }
  }

  private TypeReference() {
    const variableType = this.lookahead.value;
    this.eat("VariableType");

    const isRequired = this.lookahead.type === "!";
    if (isRequired) {
      this.eat("!");
    }
    return {
      type: "TypeReference",
      variableType,
    };
  }

  private FieldArray() {
    this.eat("[");
    console.log("fieldarray", this.lookahead);

    const isRequired = this.lookahead.type === "!";
    if (isRequired) {
      this.eat("!");
    }
    // return {
    //   type: 'FieldArray'
    //   variableType
    //   isRequired
    // }
    this.eat("]");
  }
  private Fields() {
    this.eat("{");
    const variables = [];
    while (this.lookahead.type === "FIELD_IDENTIFIER") {
      const id = this.lookahead.value.slice(0, -1);
      this.eat("FIELD_IDENTIFIER");

      const isArray = this.lookahead.type === "[";
      if (isArray) {
        this.eat("[");
      }

      const variableType = this.lookahead.value;
      this.eat("VariableType");

      let isItemRequired = false;
      if (isArray) {
        isItemRequired = this.lookahead.type === "!";
        if (isItemRequired) {
          this.eat("!");
        }
        this.eat("]");
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
        isArray,
        isItemRequired,
      });
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
