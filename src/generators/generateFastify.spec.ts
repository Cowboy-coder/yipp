import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { parse } from '../ApiParser';
import generateFastify from './generateFastify';

const generateToFile = (str: string) => {
  const data = generateFastify(parse(str));

  const filename = path.join(__dirname, '../../build', `generateFastify.ts`);

  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, data, 'utf8');
  return filename;
};

describe(generateFastify, () => {
  it('should not fail with any typescript errors', () => {
    const filename = generateToFile(fs.readFileSync(path.join(__dirname, './test.yipp'), 'utf8'));

    // TODO: Figure out a better and faster(!) way to validate the output.
    const result = spawnSync(`node_modules/.bin/tsc`, ['--noEmit', filename]);

    expect(result.error).toEqual(undefined);
    expect(result.stderr.toString()).toEqual('');
    expect(result.stdout.toString()).toEqual('');
    expect(result.status).toEqual(0);
  });
});
