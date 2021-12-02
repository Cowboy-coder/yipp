import { spawnSync } from 'child_process';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import ApiParser from '../ApiParser';
import generateFastify from './generateFastify';

const generateToFile = (str: string) => {
  const parser = new ApiParser();
  const data = generateFastify(parser.parse(str));

  const filename = path.join(__dirname, '../build', `${randomBytes(4).readUInt32LE(0).toString()}-generateFastify.ts`);

  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, data, 'utf8');
  return filename;
};

describe(generateFastify, () => {
  it('should not fail with any typescript errors', () => {
    const filename = generateToFile(`
      type AuthorizationHeader {
        authorization: String!
      }

      type SomeType {
        a: "foo"!
        b: String
        c: -42!
        d: 42!
        e: Int
        f: Boolean
        g: true
        h: false
        i: 32.0
        j: -12.042
      }

      type UserType
        | {q: String}
        | "admin"
        | "user"
        | "thug"
        | 49
        | -49
        | 12.12
        | -32.02
        | true
        | false
        | String
        | Int
        | SomeType

      type User {
        id: String!
        username: String
        status:
        | "inactive"
        | "active"
        | "maybe-active"
        someType: SomeType!
        userType: UserType
        user: User!
        address: {
          street: String
        }
      }

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
            token: String
          }
        }
        400: {
          body: Error
        }
      } 

      getUsers: GET /users {
        headers: AuthorizationHeader
        200: {
          body: [User]
        }
      } 
    `);

    // TODO: Figure out a better and faster(!) way to validate the output.
    const result = spawnSync(`../node_modules/.bin/tsc`, ['--noEmit', filename]);

    expect(result.error).toEqual(undefined);
    expect(result.stderr.toString()).toEqual('');
    expect(result.stdout.toString()).toEqual('');
    expect(result.status).toEqual(0);
  });
});
