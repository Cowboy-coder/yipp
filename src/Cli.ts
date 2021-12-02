import { program } from 'commander';
import fs from 'fs';
import ApiParser from './ApiParser';
import generateFastify from './generators/generateFastify';

program
  .description('generate fastify plugin')
  .argument('<input-file>', 'api schema file')
  .argument('<output-file>', 'generated typescript file')
  .option('-w --watch', 'watch for changes', false)
  .action(async (inputFile: string, outputFile: string, { watch }: { watch: boolean }) => {
    const generate = () => {
      const schema = fs.readFileSync(inputFile, 'utf8');
      const parser = new ApiParser();
      const ast = parser.parse(schema);
      const outputData = generateFastify(ast);
      fs.writeFileSync(outputFile, outputData, 'utf8');
      console.log('generate complete');
    };
    if (watch) {
      const watcher = fs.promises.watch(inputFile);
      console.log(`Start watch for ${inputFile}`);
      try {
        generate();
      } catch (err) {
        console.log(err);
      }
      for await (const event of watcher) {
        try {
          generate();
        } catch (err) {
          console.log(err);
        }
      }
    } else {
      generate();
    }
  })
  .showHelpAfterError();

program.parse(process.argv);
