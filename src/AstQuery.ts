import { ApiDefinition, Ast, TypeDeclaration } from './ApiParser';

export const getApiDefinitions = (ast: Ast) => {
  return ast.definitions.filter((d): d is ApiDefinition => d.type === 'ApiDefinition');
};

export const getDeclarations = (ast: Ast) => {
  return ast.definitions.filter((d): d is TypeDeclaration => d.type === 'TypeDeclaration');
};
