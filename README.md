schema-first-rest
=================

Use a GQL-inspired syntax to build a schema-first driven REST API.

```graphql
type FieldError {
  field: String!
  message: String!
}

type Error
| { message: String! } 
| {
    message: String!
    fields: [FieldError!]!
  } 
  
login: POST /login {
  body: {
    username: String!
    password: String!
  }
  200: {
    body: {
      token: String!
    }
  }
  400: {
    body: Error
  }
} 
```

Will generate this type, which is also backed by a [JSON Schema](https://json-schema.org/) so the types (compile-time) should never be different from the input/output at runtime.
```typescript
export type FieldError = {
  field: string;
  message: string;
};

export type Error =
  | {
      message: string;
    }
  | {
      message: string;
      fields: FieldError[];
    };
    
export type Api = {
  login: (req: {
    body: {
      username: string;
      password: string;
    };
  }) =>
    | MaybePromise<{
        code: 200;
        body: {
          token: string;
        };
      }>
    | MaybePromise<{
        code: 400;
        body: Error;
      }>;
}
```

Then the implementation of it is as simple as this
```typescript
addRoutes(fastify, {
  login: ({ body: { username, password } }) => {
    return Math.random() > 0.5
      ? {
          code: 200,
          body: {
            token: "newtoken yo",
          },
        }
      : {
          code: 400,
          body: {
            message: "damn",
            fields: {
              username,
              password,
            },
          },
        };
  },
});
```

This uses [fastify](https://www.fastify.io/) underneath but could in theory use any framework.

🐄