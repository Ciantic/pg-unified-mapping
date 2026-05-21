import type { PGUNIFIED_TYPE_MAPPING } from "pg-unified-mapping";
import { expect } from "vitest";

export type TestTable = Record<
  string,
  {
    type: string;
    input: any;
    output?: any;
  }
>;

type MapperRec = string | readonly string[] | ["array", MapperRec];
type Mapper = () => {
  readonly input: MapperRec;
  readonly output: MapperRec;
};

function primitiveValidation(type: MapperRec, value: any): boolean {
  // ["array", innerType] — value must be an array whose elements match innerType
  if (Array.isArray(type) && type[0] === "array") {
    if (!Array.isArray(value)) return false;
    return value.every((item: any) => primitiveValidation(type[1], item));
  }

  // readonly string[] — union type, value must match at least one
  if (Array.isArray(type)) {
    return type.some((t) => primitiveValidation(t, value));
  }

  // Single primitive type
  switch (type) {
    case "null":
      return value === null;
    case "undefined":
      return value === undefined;
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && !Number.isNaN(value);
    case "bigint":
      return typeof value === "bigint";
    case "boolean":
      return typeof value === "boolean";
    case "dateObject":
      return value instanceof Date && !isNaN(value.getTime());
    case "uint8Array":
      return value instanceof Uint8Array;
    case "object":
      return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof Uint8Array)
      );
    default:
      return false;
  }
}

interface Opts {
  table: TestTable;
  mapping: typeof PGUNIFIED_TYPE_MAPPING;
  exec(sql: string): Promise<void>;
  query(sql: string, params?: any[]): Promise<{ rows: Record<string, any>[] }>;
}

export async function runMappingTest(opts: Opts) {
  const createTableSql = `
      CREATE TEMP TABLE test_pg (
        ${Object.entries(opts.table)
          .map(([columnName, { type }]) => {
            if (columnName.endsWith("_null")) {
              return `"${columnName}" ${type} NULL`;
            }
            return `"${columnName}" ${type} NOT NULL`;
          })
          .join(",\n        ")}
      );
    `;
  await opts.query(createTableSql);

  const insertValue = Object.fromEntries(
    Object.entries(opts.table).map(([columnName, { input: value }]) => [
      columnName,
      value,
    ]),
  );

  // const expectValue = Object.fromEntries(
  //   Object.entries(opts.table).map(
  //     ([columnName, p]: [string, { output?: any; input: any }]) => [
  //       columnName,
  //       p.output ?? p.input,
  //     ],
  //   ),
  // );

  // Insert
  const columns = Object.keys(insertValue);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  await opts.query(
    `INSERT INTO test_pg (${columns.join(", ")}) VALUES (${placeholders})`,
    Object.values(insertValue),
  );

  // Select
  const result = await opts.query(`SELECT * FROM test_pg`);
  const row = result.rows[0] as Record<string, any>;
  // Sanity check - ensure we got the expected number of columns back
  // expect(Object.keys(row).length).toBe(Object.keys(expectValue).length);

  // Validate against mapping
  Object.entries(opts.table).forEach(
    ([columnName, { type, input, output }]) => {
      if (typeof output === "undefined") {
        output = input;
      }
      expect(row[columnName], `Column "${columnName}"`).toEqual(output);
      if (columnName.endsWith("_null")) {
        return; // skip validation for nullability test columns
      }

      const key = type as keyof typeof opts.mapping;
      let mapping = opts.mapping[key] as Mapper;
      const isArrayType = type.endsWith("[]");
      const baseTypeMatch = type.match(/^(\w+)/)?.[1];
      const decimalMatch = type.match(/^decimal\((\d+),\s*(\d+)\)/);
      const varcharMatch = type.match(/^varchar\((\d+)\)/);
      const charMatch = type.match(/^char\((\d+)\)/);
      const bitMatch = type.match(/^bit\((\d+)\)/);
      const varbitMatch = type.match(/^varbit\((\d+)\)/);
      if (baseTypeMatch && baseTypeMatch in opts.mapping) {
        mapping = opts.mapping[
          baseTypeMatch as keyof typeof opts.mapping
        ] as Mapper;
      }

      if (decimalMatch) {
        mapping = () =>
          opts.mapping?.["decimal"]?.(
            Number(decimalMatch[1]),
            Number(decimalMatch[2]),
          )!;
      } else if (varcharMatch) {
        mapping = () => opts.mapping?.["varchar"]?.(Number(varcharMatch[1]))!;
      } else if (charMatch) {
        mapping = () => opts.mapping?.["char"]?.(Number(charMatch[1]))!;
      } else if (bitMatch) {
        mapping = () => opts.mapping?.["bit"]?.(Number(bitMatch[1]))!;
      } else if (varbitMatch) {
        mapping = () => opts.mapping?.["varbit"]?.(Number(varbitMatch[1]))!;
      }

      if (typeof mapping !== "function") {
        throw new Error(`No mapping found for type "${type}"`);
      }
      if (isArrayType) {
        const innerMapping = mapping();
        mapping = () => ({
          input: ["array", innerMapping.input],
          output: ["array", innerMapping.output ?? innerMapping.input],
        });
      }

      let types = mapping();

      let inputValidator: MapperRec = types.input;
      let outputValidator: MapperRec = types.output ?? types.input;

      expect(
        primitiveValidation(inputValidator, input),
        `Input validation failed for column "${columnName}"`,
      ).toBe(true);
      expect(
        primitiveValidation(outputValidator ?? inputValidator, output),
        `Output validation failed for column "${columnName}"`,
      ).toBe(true);
    },
  );
}
