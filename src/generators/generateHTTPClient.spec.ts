import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import ApiParser from '../ApiParser';
import generateHTTPClient from './generateHTTPClient';

const generateToFile = (str: string) => {
  const parser = new ApiParser();
  const data = generateHTTPClient(parser.parse(str));

  const filename = path.join(__dirname, '../../build', `generateHTTPClient-${new Date().getTime()}.ts`);

  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, data, 'utf8');
  return filename;
};

describe(generateHTTPClient, () => {
  it('works', () => {
    const filename = generateToFile(`
      type User {
        id: String!
      }
      type Error {
        message: String!
      }
      getUser: GET /user/:id(Int) {
        headers: {
          content-type: "application/json"
        }
        body: {
          x: String!
        }
        query: {
          filter: String
          type: Int
        }
        200: {
          body: {
            id: String!
            username: String!
            age: Int
          }
        }
        404: {
          body: {
            id: String!
            username: String!
            age: Int
          }
        }
        500: {
          body: Error
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
