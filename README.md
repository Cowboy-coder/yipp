yipp
====

Use a GQL-inspired syntax to build a schema-first driven REST API.

```graphql
# schema.yipp

type FieldError {
  field: String!
  message: String!
}

type Error {
  message: String!
  fields: [FieldError!]!
} 

enum UserType {
  admin
  user
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

getUser: GET /users/:id(Int) {
  headers: {
    authorization: String!
  }
  
  200: {
    body: {
      id: Int!
      username: String!
      type: UserType!
    }
  }

  400: {
    body: Error
  }
}
```

### Install and usage


```
npm install -g yipp
yipp axios-client output.ts schema.yipp
```

### CLI

Can be used to generate different clients, servers, etc.

Example of generators using [this schema](https://github.com/Cowboy-coder/yipp/tree/master/src/examples/schemas/):
- [`fastify-plugin`](https://github.com/Cowboy-coder/yipp/tree/master/src/examples/fastify/routes.ts) - Fastify Plugin
- [`axios-client`](https://github.com/Cowboy-coder/yipp/tree/master/src/examples/axios-client/generated.ts) - HTTP Client using Axios

```
Usage: yipp [options] <type> <output-file> <input-file...>

generate

Arguments:
  type         (choices: "fastify-plugin", "axios-client")
  output-file  generated typescript file
  input-file   One or more api schema files. Will be merged into one schema if several files.

Options:
  -w --watch   watch for changes (default: false)
  -h, --help   display help for command
```

🐄
