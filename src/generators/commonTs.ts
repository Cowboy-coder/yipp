import {
  ApiFieldDefinition,
  Builtin,
  Docs,
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
  return `${generateDocs(field.docs)}"${field.name}"${field.isRequired ? ':' : '?:'} ${
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

export const generateDocs = (docs: Docs): string => {
  if (!docs) {
    return '';
  }
  let docString = '/**\n';
  docs.value.split('\n').forEach((doc) => {
    docString += `* ${doc}\n`;
  });
  docString += '*/\n';

  return docString;
};

export const generateDeclarations = (
  declarations: (TypeDeclaration | EnumDeclaration | UnionDeclaration)[],
): string => {
  return declarations
    .map((d) => {
      if (d.type === 'UnionDeclaration') {
        return `${generateDocs(d.docs)}export type ${d.name} = ${d.items.map((f) => f.value).join(' | ')}`;
      }
      if (d.type === 'EnumDeclaration') {
        return `${generateDocs(d.docs)}export enum ${d.name} {
            ${d.fields
              .map((field) => {
                return `${generateDocs(field.docs)}${field.name} = "${field.value}"`;
              })
              .join(',\n')}
          }`;
      }
      if (d.variableType === 'Object') {
        return `${generateDocs(d.docs)}export type ${d.name} = {
            ${d.fields.map(field).join('\n')}
          }`;
      }
    })
    .join('\n');
};
