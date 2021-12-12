import { ApiDefinition, Ast, EnumDeclaration, TypeDeclaration } from './ApiParser';

export const getApiDefinitions = (ast: Ast) => {
  return ast.definitions.filter((d): d is ApiDefinition => d.type === 'ApiDefinition');
};

export const getDeclarations = (ast: Ast) => {
  return ast.definitions.filter(
    (d): d is TypeDeclaration | EnumDeclaration => d.type === 'TypeDeclaration' || d.type === 'EnumDeclaration',
  );
};
