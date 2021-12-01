import { program } from "commander";
import fs from "fs";
import ApiParser from "./ApiParser";
import generateFastify from "./generators/generateFastify";

program
  .description("generate fastify plugin")
  .argument("<input-file>", "api schema file")
  .argument("<output-file>", "Output typescript file")
  .action((inputFile: string, outputFile: string) => {
    const schema = fs.readFileSync(inputFile, "utf8");
    const parser = new ApiParser();
    const ast = parser.parse(schema);
    const outputData = generateFastify(ast);
    fs.writeFileSync(outputFile, outputData, "utf8");
  })
  .showHelpAfterError();

program.parse(process.argv);
