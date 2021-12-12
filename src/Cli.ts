#! /usr/bin/env node
import chalk from 'chalk';
import { Argument, program } from 'commander';
import fs from 'fs';
import { ApiSyntaxError, Ast, parseFiles } from './ApiParser';
import generateFastify from './generators/generateFastify';
import generateHTTPClient from './generators/generateHTTPClient';
import PrettyError from './PrettyError';

type GenerateType = 'fastify-plugin' | 'http-client';

const generator = (type: GenerateType, ast: Ast) => {
  if (type === 'fastify-plugin') {
    return generateFastify(ast);
  } else if (type === 'http-client') {
    return generateHTTPClient(ast);
  }
  throw new Error(`Unsupported generator type ${type}`);
};
program
  .name('yipp')
  .description('generate')
  .addArgument(new Argument('<type>').choices(['fastify-plugin', 'http-client']))
  .argument('<output-file>', 'generated typescript file')
  .argument('<input-file...>', 'One or more api schema files. Will be merged into one schema if several files.')
  .option('-w --watch', 'watch for changes', false)
  .action(async (type: GenerateType, outputFile: string, inputFiles: string[], { watch }: { watch: boolean }) => {
    const generate = (exit = false) => {
      const measure = new Date().getTime();

      try {
        const ast = parseFiles(inputFiles);
        const outputData = generator(type, ast);
        fs.writeFileSync(outputFile, outputData, 'utf8');
        console.log(` ${chalk.green.bold('✓')} ${outputFile} ${chalk.green(`${new Date().getTime() - measure}ms`)}`);
        if (exit) {
          process.exit(0);
        }
      } catch (err: unknown) {
        if (err instanceof ApiSyntaxError) {
          console.log(
            `${chalk.red(err.token.filename)}:${chalk.yellow(err.token.line)}:${chalk.yellow(err.token.col + 1)}`,
          );
          console.log(
            PrettyError({
              token: err.token,
              errorMessage: err.message,
            }),
          );
        } else {
          console.log(err);
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
