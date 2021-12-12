import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import { Ast } from '../ApiParser';
import { getApiDefinitions, getDeclarations } from '../AstQuery';
import { generateApiField, generateDeclarations, generateType } from './commonTs';

const prettierConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')).prettier;

const generateHTTPClient = (ast: Ast) => {
  const declarations = getDeclarations(ast);
  return prettier.format(
    `
  import Axios, { AxiosResponse, AxiosRequestConfig } from 'axios'


  ${generateDeclarations(declarations)}

  const createHTTPClient = (config?: AxiosRequestConfig) => {
    const axios = Axios.create(config);

    return {
      ${getApiDefinitions(ast)
        .map((d) => {
          let path = d.path;
          d.params?.fields.forEach((p) => {
            path = path.replace(`:${p.name}`, `\${${p.name}}`);
          });
          const params = d.params?.fields.map((f) => `${f.name}:${generateType(f)}`).join(',') ?? '';
          const req = (['query', 'body', 'headers'] as const)
            .map((t) => {
              const x = d[t];
              if (x === undefined) {
                return '';
              }
              let isRequired = false;

              if (x.variableType === 'Object') {
                isRequired = x.fields.every((f) => f.isRequired);
              } else if (x.variableType === 'TypeReference') {
                const declaration = declarations.find((declaration) => declaration.name === x.value);
                if (declaration?.type === 'TypeDeclaration' && declaration.variableType === 'Object') {
                  isRequired = declaration?.fields.every((f) => f.isRequired);
                }
              }
              return `${isRequired ? t : `${t}?`}: ${generateApiField(x)}`;
            })
            .filter((x) => !!x)
            .join(',\n');
          return `
      async "${d.name}"(
          ${[params ? `${params}` : '', req ? `req:{${req}}` : ''].filter((x) => !!x).join(',')}
        ): Promise<AxiosResponse<${
          d.responses
            .filter((r) => r.status >= 200 && r.status < 300)
            .map(({ body }) => {
              return body ? generateApiField(body) : '';
            })
            .join(' | ') || 'undefined'
        }
        >>
      {
        return axios.request({
          method: '${d.method}',
          url: \`${path}\`,
          ${d.query ? 'params: req.query,' : ''}
          ${d.headers ? 'headers: req.headers,' : ''}
          data: ${d.body ? 'req.body,' : '{}'}
        })
      },
      `;
        })
        .join('')}
    }
  }

  export default createHTTPClient
  `,
    {
      parser: 'typescript',
      ...prettierConfig,
    },
  );
};
export default generateHTTPClient;
