import chalk from 'chalk';
import { program } from 'commander';
import fs from 'fs';
import ApiParser, { ApiSyntaxError } from './ApiParser';
import generateFastify from './generators/generateFastify';
import PrettyError from './PrettyError';

program
  .description('generate fastify plugin')
  .argument('<input-file>', 'api schema file')
  .argument('<output-file>', 'generated typescript file')
  .option('-w --watch', 'watch for changes', false)
  .action(async (inputFile: string, outputFile: string, { watch }: { watch: boolean }) => {
    const generate = (exit = false) => {
      try {
        const measure = new Date().getTime();
        const schema = fs.readFileSync(inputFile, 'utf8');
        const parser = new ApiParser();
        const ast = parser.parse(schema);
        const outputData = generateFastify(ast);
        fs.writeFileSync(outputFile, outputData, 'utf8');
        console.log(` ${chalk.green.bold('✓')} ${outputFile} ${chalk.green(`${new Date().getTime() - measure}ms`)}`);
      } catch (err: unknown) {
        if (err instanceof ApiSyntaxError) {
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
        if (exit) {
          process.exit(1);
        }
      }
    };
    if (watch) {
      const watcher = fs.promises.watch(inputFile);
      console.log(`${chalk.bold('WATCH')} ${inputFile}`);
      generate();
      for await (const event of watcher) {
        if (event.eventType === 'change') {
          generate();
        }
      }
    } else {
      generate(true);
    }
  })
  .showHelpAfterError();

program.parse(process.argv);
