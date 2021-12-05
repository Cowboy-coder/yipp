import {
  ApiFieldDefinition,
  BooleanLiteral,
  BooleanVariable,
  FloatLiteral,
  FloatVariable,
  IntLiteral,
  IntVariable,
  ObjectField,
  StringLiteral,
  StringVariable,
  TypeDeclaration,
  TypeReference,
  UnionItem,
} from '../ApiParser';

const generateType = (
  d:
    | BooleanVariable
    | IntVariable
    | StringVariable
    | FloatVariable
    | BooleanLiteral
    | IntLiteral
    | StringLiteral
    | FloatLiteral
    | TypeReference,
): string => {
  switch (d.variableType) {
    case 'Int':
      return 'number';
    case 'IntLiteral':
      return `${d.value}`;
    case 'String':
      return 'string';
    case 'StringLiteral':
      return `"${d.value}"`;
    case 'Boolean':
      return 'boolean';
    case 'BooleanLiteral':
      return `${d.value}`;
    case 'Float':
      return 'number';
    case 'FloatLiteral':
      return `${d.value}`;
    case 'TypeReference':
      return d.value;
    default:
      throw `unsupported type`;
  }
};

const generateUnionItem = (union: UnionItem) => {
  return union.variableType === 'Object' ? generateFields(union.fields) : generateType(union);
};

const field = (field: ObjectField) => {
  return `"${field.name}"${field.isRequired ? ':' : '?:'} ${
    field.variableType === 'Object'
      ? generateFields(field.fields)
      : field.variableType === 'Union'
      ? field.unions.map(generateUnionItem).join(' | ')
      : field.variableType === 'Array'
      ? `(${generateType(field.items)}${field.items.isRequired === false ? ' | null' : ''})[]`
      : generateType(field)
  }`;
};

const generateFields = (fields: ObjectField[]): string => {
  return `{
    ${fields.map(field).join('\n')}
  }`;
};

export const generateApiField = (d: ApiFieldDefinition | undefined) => {
  if (d === undefined) {
    return 'undefined';
  }
  return `${
    d.variableType === 'Object'
      ? generateFields(d.fields)
      : d.variableType === 'Array'
      ? `(${generateType(d.items)}${d.items.isRequired === false ? ' | null' : ''})[]`
      : generateType(d)
  }`;
};

export const generateDeclarations = (declarations: TypeDeclaration[]): string => {
  return declarations
    .map((d) => {
      if (d.variableType === 'Object') {
        return `export type ${d.name} = {
            ${d.fields.map(field).join('\n')}
          }`;
      }
      if (d.variableType === 'Union') {
        return `export type ${d.name} = ${d.unions.map(generateUnionItem).join(' | ')}`;
      }
    })
    .join('\n');
};