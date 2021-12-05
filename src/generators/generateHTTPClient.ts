import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import { Ast } from '../ApiParser';
import { getApiDefinitions, getDeclarations } from '../AstQuery';
import { generateApiField, generateDeclarations, generateType } from './commonTs';

const prettierConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')).prettier;

const generateHTTPClient = (ast: Ast) => {
  // getDeclarations(ast).map(d => {
  //   d.name
  // })
  return prettier.format(
    `
  import Axios, { AxiosResponse, AxiosRequestConfig } from 'axios'


  ${generateDeclarations(getDeclarations(ast))}

  const createApiClient = (config: AxiosRequestConfig) => {
    const axios = Axios.create(config);

    return {
      ${getApiDefinitions(ast)
        .map((d) => {
          let path = d.path;
          d.params?.fields.forEach((p) => {
            path = path.replace(`:${p.name}`, `\${${p.name}}`);
          });
          if (d.query && d.query.variableType !== 'Object') {
            throw new Error('unsupported query');
          }
          return `
      async "${d.name}"(${d.params?.fields.map((f) => `${f.name}:${generateType(f)}`).join(',')}, req: {
        ${(['query', 'body', 'headers'] as const)
          .map((t) => {
            const x = d[t];
            if (x === undefined) {
              return '';
            }

            const isRequired = x.variableType === 'Object' && x.fields.every((f) => f.isRequired);
            return `${isRequired ? t : `${t}?`}: ${generateApiField(x)}`;
          })
          .filter((x) => !!x)
          .join(',\n')}
      }): Promise<AxiosResponse<${d.responses
        .filter((r) => r.status >= 200 && r.status < 300)
        .map(({ body }) => {
          return body ? generateApiField(body) : '';
        })
        .join(' | ')}
        >>
      {
        const response = await axios.request({
          method: '${d.method}',
          url: \`${path}\`,
          params: req.query,
          ${d.headers ? 'headers: (req.headers as any),' : ''}
          ${d.body ? 'data: req.body,' : ''}
        })
        return response
      },
      `;
        })
        .join('')}
    }
  }

  const api = createApiClient({ baseURL: 'x' });
  async () => {
    const user = await api.user(1, {
      body: { x: '' },
    });
  };

  export default createApiClient
  `,
    {
      parser: 'typescript',
      ...prettierConfig,
    },
  );
};
// const a = fetch({})
// fetch({
//   url: ''
//   query: {}
// })

export default generateHTTPClient;
