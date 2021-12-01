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
import RestPlugin, {Api} from "./generated";

type Context {
  db: DbInstance
}
const routes: Api<Context> = {
  login: async ({ body: { username, password } }, { db }) => {
    return await db.login(username, password)
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
}

fastify.register(RestPlugin, {
  routes: routes,
  setContext: (req) => ({
    db: {}
  }),
});
```
This uses [fastify](https://www.fastify.io/) underneath but could in theory use any framework.

A more complete (but WIP) example can be seen in [fastifyExample](https://github.com/Cowboy-coder/schema-first-rest/tree/master/fastifyExample).

### CLI

```
Usage: Cli [options] <input-file> <output-file>

generate fastify plugin

Arguments:
  input-file   api schema file
  output-file  generated typescript file

Options:
  -w --watch   watch for changes (default: false)
  -h, --help   display help for command
```

For example

```
./node_modules/.bin/ts-node Cli.ts --watch ./fastifyExample/api.schema ./fastifyExample/generated.ts 
```

🐄
