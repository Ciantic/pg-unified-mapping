import type { StandardSchemaV1 } from "@standard-schema/spec";
import * as s from "./simplevalidation.ts";
import { io } from "./simplevalidation.ts";
import type { PostgresTypeBuilder } from "./types.ts";

// Common numeric type accepts string, number or bigint
const numeric = s.union(s.string, s.number, s.bigint);

export const PGUNIFIED_TYPE_MAPPING = {
  // Numeric types, alias follows in comments
  int2: () => io(numeric, s.number), // smallint
  int4: () => io(numeric, s.number), // integer
  int8: () => io(numeric, s.bigint), // bigint
  serial2: () => io(numeric, s.number), // smallserial
  serial4: () => io(numeric, s.number), // serial
  serial8: () => io(numeric, s.bigint), // bigserial
  float4: () => io(numeric, s.number), // real
  float8: () => io(numeric, s.number), // double precision
  decimal: (_?) => io(numeric, s.string), // numeric
  money: () => io(s.string),

  // Character types
  text: () => io(s.string),
  varchar: (p) => io(s.stringMaxLength(p)),
  char: (p) => io(s.stringLength(p)),

  // Binary types
  bytea: () => io(s.uint8Array),

  // Date/Time types
  timestamp: (_?) => io(s.string), // Naive datetime as YYYY-MM-DD HH:MM:SS
  timestamptz: () => io(s.dateObject),
  date: () => io(s.string), // Date as YYYY-MM-DD string
  time: (_?) => io(s.string), // Time as HH:MM:SS string
  timetz: (_?) => io(s.string), // Time with timezone as HH:MM:SS±HH:MM string
  interval: (_?) => io(s.string),

  // Boolean type
  boolean: () => io(s.boolean),

  // UUID type
  uuid: () => io(s.string),

  // JSON types
  jsonb: () => io(s.object),
  json: () => io(s.object),

  // Network address types
  inet: () => io(s.string),
  cidr: () => io(s.string),
  macaddr: () => io(s.string),
  macaddr8: () => io(s.string),

  // Bit string types
  bit: (p) => io(s.stringLength(p)),
  varbit: (p) => io(s.stringMaxLength(p)),

  // Text search types
  tsvector: () => io(s.string),
  tsquery: () => io(s.string),

  // XML type
  xml: () => io(s.string),

  // Geometric types
  point: () => io(s.string),
  line: () => io(s.string),
  lseg: () => io(s.string),
  box: () => io(s.string),
  path: () => io(s.string),
  polygon: () => io(s.string),
  circle: () => io(s.string),

  // Object identifier / system types
  xmin: () => io(s.number),
  pg_lsn: () => io(s.string),
  pg_snapshot: () => io(s.string),
} satisfies PostgresTypeBuilder<{
  input: StandardSchemaV1;
  output: StandardSchemaV1;
}>;

type Numeric = string | number | bigint;
type InputOutput<I, O = I> = {
  input: I;
  output: O;
};

export type PgUnifiedTypeMapping = {
  // Numeric types
  int2: InputOutput<Numeric, number>;
  int4: InputOutput<Numeric, number>;
  int8: InputOutput<Numeric, bigint>;
  serial2: InputOutput<Numeric, number>;
  serial4: InputOutput<Numeric, number>;
  serial8: InputOutput<Numeric, bigint>;
  float4: InputOutput<Numeric, number>;
  float8: InputOutput<Numeric, number>;
  decimal: InputOutput<Numeric, string>;
  money: InputOutput<string>;

  // Character types
  text: InputOutput<string>;
  varchar: InputOutput<string>;
  char: InputOutput<string>;

  // Binary types
  bytea: InputOutput<Uint8Array>;

  // Date/Time types
  timestamp: InputOutput<string>;
  timestamptz: InputOutput<Date>;
  date: InputOutput<string>;
  time: InputOutput<string>;
  timetz: InputOutput<string>;
  interval: InputOutput<string>;

  // Boolean type
  boolean: InputOutput<boolean>;

  // UUID type
  uuid: InputOutput<string>;

  // JSON types
  jsonb: InputOutput<object>;
  json: InputOutput<object>;

  // Network address types
  inet: InputOutput<string>;
  cidr: InputOutput<string>;
  macaddr: InputOutput<string>;
  macaddr8: InputOutput<string>;

  // Bit string types
  bit: InputOutput<string>;
  varbit: InputOutput<string>;

  // Text search types
  tsvector: InputOutput<string>;
  tsquery: InputOutput<string>;

  // XML type
  xml: InputOutput<string>;

  // Geometric types
  point: InputOutput<string>;
  line: InputOutput<string>;
  lseg: InputOutput<string>;
  box: InputOutput<string>;
  path: InputOutput<string>;
  polygon: InputOutput<string>;
  circle: InputOutput<string>;

  // Object identifier / system types
  xmin: InputOutput<number>;
  pg_lsn: InputOutput<string>;
  pg_snapshot: InputOutput<string>;
};
