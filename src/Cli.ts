import chalk from 'chalk';
import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import ApiParser, { ApiSyntaxError, Ast } from './ApiParser';
import generateFastify from './generators/generateFastify';
import PrettyError from './PrettyError';

program
  .description('generate fastify plugin')
  .argument('<output-file>', 'generated typescript file')
  .argument('<input-file...>', '1 or more api schema files. Will be merged into 1.')
  .option('-w --watch', 'watch for changes', false)
  .action(async (outputFile: string, inputFiles: string[], { watch }: { watch: boolean }) => {
    const generate = (exit = false) => {
      const measure = new Date().getTime();
      const mergedAst: Ast = {
        type: 'Document',
        definitions: [],
      };

      let write = true;
      for (const inputFile of inputFiles) {
        try {
          const schema = fs.readFileSync(inputFile, 'utf8');
          const parser = new ApiParser();
          const ast = parser.parse(schema);
          mergedAst.definitions = [...mergedAst.definitions, ...ast.definitions];
        } catch (err: unknown) {
          if (err instanceof ApiSyntaxError) {
            console.log(
              `${chalk.red(path.join(process.cwd(), inputFile))}:${chalk.yellow(err.token.line)}:${chalk.yellow(
                err.token.col + 1,
              )}`,
            );
            console.log(
              PrettyError({
                token: err.token,
                document: err.document,
                errorMessage: err.message,
              }),
            );
          } else {
            console.log(err);
          }
          write = false;
        }
      }

      if (write) {
        const outputData = generateFastify(mergedAst);
        fs.writeFileSync(outputFile, outputData, 'utf8');
        console.log(` ${chalk.green.bold('✓')} ${outputFile} ${chalk.green(`${new Date().getTime() - measure}ms`)}`);
      } else {
        if (exit) {
          process.exit(1);
        }
      }
    };
    if (watch) {
      const watchAll = async function () {
        return Promise.all(
          inputFiles.map((file) => {
            console.log(`${chalk.bold('WATCH')} ${file}`);
            return fs.promises.watch(file);
          }),
        );
      };

      generate();
      (await watchAll()).map(async (x) => {
        for await (const event of x) {
          if (event.eventType === 'change') {
            generate();
          }
        }
      });
    } else {
      generate(true);
    }
  })
  .showHelpAfterError();

program.parse(process.argv);
