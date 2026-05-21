/**
 * Helper function to define input and output types for the mapping.
 *
 * - Input = INSERT and UPDATE input type
 * - Output = SELECT output type
 */
function io<const I extends KnownType, const O extends KnownType = I>(
  input: I,
): { input: I; output: O };

function io<const I extends KnownType, const O extends KnownType = I>(
  input: I,
  output: O,
): { input: I; output: O };

function io(input: unknown, output?: unknown) {
  return { input, output: output ?? input };
}

const numeric = ["string", "number", "bigint"] as const;

export const PGUNIFIED_TYPE_MAPPING = {
  // Numeric types, alias follows in comments
  int2: () => io(numeric, "number"), // smallint
  int4: () => io(numeric, "number"), // integer
  int8: () => io(numeric, "bigint"), // bigint
  serial2: () => io(numeric, "number"), // smallserial
  serial4: () => io(numeric, "number"), // serial
  serial8: () => io(numeric, "bigint"), // bigserial
  float4: () => io(numeric, "number"), // real
  float8: () => io(numeric, "number"), // double precision
  decimal: (p: number, s: number) => io(numeric, "string"), // numeric
  money: () => io("string"),

  // Character types
  text: () => io("string"),
  varchar: (maxLength: number) => io("string"),
  char: (length: number) => io("string"),

  // Binary types
  bytea: () => io("uint8Array"),

  // Date/Time types
  timestamp: (precision?: number) => io("string"), // Naive datetime as YYYY-MM-DD HH:MM:SS
  timestamptz: () => io("dateObject"),
  date: () => io("string"), // Date as YYYY-MM-DD string
  time: (precision?: number) => io("string"), // Time as HH:MM:SS string
  timetz: (precision?: number) => io("string"), // Time with timezone as HH:MM:SS±HH:MM string
  interval: (precision?: number) => io("string"),

  // Boolean type
  boolean: () => io("boolean"),

  // UUID type
  uuid: () => io("string"),

  // JSON types
  jsonb: () => io("object"),
  json: () => io("object"),

  // Network address types
  inet: () => io("string"),
  cidr: () => io("string"),
  macaddr: () => io("string"),
  macaddr8: () => io("string"),

  // Bit string types
  bit: (length: number) => io("string"),
  varbit: (maxLength: number) => io("string"),

  // Text search types
  tsvector: () => io("string"),
  tsquery: () => io("string"),

  // XML type
  xml: () => io("string"),

  // Geometric types
  point: () => io("string"),
  line: () => io("string"),
  lseg: () => io("string"),
  box: () => io("string"),
  path: () => io("string"),
  polygon: () => io("string"),
  circle: () => io("string"),

  // Object identifier / system types
  xmin: () => io("number"),
  pg_lsn: () => io("string"),
  pg_snapshot: () => io("string"),
} as const;

/**
 * Type that represents the input and output types for a given PostgreSQL type mapping.
 *
 * Input = Type used for INSERT and UPDATE operations
 * Output = Type used for SELECT operations results
 */
export type InputOutput<I, O = I> = {
  input: I;
  output: O;
};

// Map from string literal names to actual TypeScript types
type TypeLiteralMap = {
  string: string;
  number: number;
  bigint: bigint;
  boolean: boolean;
  dateObject: Date;
  uint8Array: Uint8Array;
  object: Record<string, any>;
};

type KnownType =
  | keyof TypeLiteralMap
  | readonly (keyof TypeLiteralMap)[]
  | ["array", KnownType];

// Expands a const tuple like readonly ["string", "number", "bigint"] to string | number | bigint,
// or a single literal like "number" to the actual number type
type ExpandLiteral<T> = T extends readonly unknown[]
  ? TypeLiteralMap[T[number] & keyof TypeLiteralMap]
  : TypeLiteralMap[T & keyof TypeLiteralMap];

// Infer the full type mapping from the PGUNIFIED_TYPE_MAPPING const
export type PgUnifiedMapping = {
  [K in keyof typeof PGUNIFIED_TYPE_MAPPING]: InputOutput<
    ExpandLiteral<ReturnType<(typeof PGUNIFIED_TYPE_MAPPING)[K]>["input"]>,
    ExpandLiteral<ReturnType<(typeof PGUNIFIED_TYPE_MAPPING)[K]>["output"]>
  >;
};
