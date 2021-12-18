import { ApiDefinition, ApiGroup, Ast, EnumDeclaration, TypeDeclaration, UnionDeclaration } from './ApiParser';

export const getApiGroups = (ast: Ast) => {
  return ast.definitions.filter((d): d is ApiGroup => d.type === 'ApiGroup');
};

export const getApiDefinitions = (ast: Ast) => {
  return ast.definitions.filter((d): d is ApiDefinition => d.type === 'ApiDefinition');
};

export const getDeclarations = (ast: Ast) => {
  return ast.definitions.filter(
    (d): d is TypeDeclaration | EnumDeclaration | UnionDeclaration =>
      d.type === 'TypeDeclaration' || d.type === 'EnumDeclaration' || d.type === 'UnionDeclaration',
  );
};
