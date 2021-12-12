import {
  ApiFieldDefinition,
  Builtin,
  EnumDeclaration,
  ObjectField,
  TypeDeclaration,
  TypeReference,
  UnionDeclaration,
} from '../ApiParser';

export const generateType = (d: Builtin | TypeReference): string => {
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
    case 'DateTime':
      return 'string';
    case 'TypeReference':
      return d.value;
    default:
      throw new Error(`Unsupported type`);
  }
};

const field = (field: ObjectField) => {
  field.variableType;

  return `"${field.name}"${field.isRequired ? ':' : '?:'} ${
    field.variableType === 'Object'
      ? generateFields(field.fields)
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

export const generateApiField = (d: ApiFieldDefinition) => {
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

export const generateDeclarations = (
  declarations: (TypeDeclaration | EnumDeclaration | UnionDeclaration)[],
): string => {
  return declarations
    .map((d) => {
      if (d.type === 'UnionDeclaration') {
        return `export type ${d.name} = ${d.items.map((f) => f.value).join(' | ')}`;
      }
      if (d.type === 'EnumDeclaration') {
        return `export enum ${d.name} {
            ${d.fields
              .map((field) => {
                return `${field.name} = "${field.value}"`;
              })
              .join(',\n')}
          }`;
      }
      if (d.variableType === 'Object') {
        return `export type ${d.name} = {
            ${d.fields.map(field).join('\n')}
          }`;
      }
    })
    .join('\n');
};
