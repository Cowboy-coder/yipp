type schema = {
  fetchUser: {
    name: "GET /:userId";
    input: {
      params: {
        userId: number;
      };
      query: {
        filter: "name" | "age";
        perPage: number;
        page: number;
      };
    };
    "200": {
      id: number;
      username: string;
    };
    "400": {
      message: string;
      status: number;
    };
  };
  createUser: {
    name: "POST /";
    input: {
      body: {
        userId: number;
      };
    };
    "200": {
      id: number;
      username: string;
    };
    "400": {
      message: string;
      status: number;
    };
  };
};

`
Type Error {
  status: Int!
  message: String!
  errors: [{name: String!, message: String!}!]!
}

Type User {
  id: String!
  firstName: String!
  lastName: String!
  email: String!
}

GET /user/:id {
  params: {
    id: String!
  }
}: {
  200: User!
  404: Error!
  409: Error!
}

POST /user/:id {
  params: {
    id: String!
  }
  query: {
    filter: "id" | "body"
    perPage: Int!
  }
  body: Omit<User, 'id'>
}: {
  200: User!
  404: Error!
  409: Error!
}

PATCH /user/:id {
  params: {
    id: String!
  }
  query: {
    filter: "id" | "body"
    perPage: Int!
  }
  body: Omit<Parial<User>, 'id'>
}: {
  200: User!
  404: Error!
  409: Error!
}
`;

const CreateUser = ({
  body,
  filter,
  perPage,
}: {
  body: { id: string };
  filter: "id" | "body";
  perPage: number;
}) => {};
type Route = {
  getUser: (req: { params: { id: number } }, res: any) => string;
};
const Route: Route = {
  getUser: (req, res) => {
    return "FOO";
    console.log(req.params.id);
  },
};

// class User {
//   id: string;
// }

// const GetUser({})
