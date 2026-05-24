/**
 * Takes in a `pg` module, returns options for PG client
 *
 * Example:
 * ```
 * import pg from "pg";
 *
 * const client = await new pg.Client({ host: "localhost", types: createPgMapperTypes(pg), });
 */
export function createPgMapperTypes(pg: {
  types: {
    getTypeParser: (
      oid: number,
      format?: "binary" | "text",
    ) => (val: string) => any;
    arrayParser:
      | any
      | {
          create: (
            source: any,
            transform?: any,
          ) => {
            parse: () => any[];
          };
        };
  };
}) {
  const stringParser = (val: string) => val;
  const arrayStringParser = (val: string) =>
    pg.types.arrayParser.create(val).parse();

  return {
    getTypeParser: (oid: number, format?: "binary" | "text") => {
      // https://github.com/postgres/postgres/blob/master/src/include/catalog/pg_type.dat

      // int8/serial8: return bigint instead of number | bigint
      if (oid === 20) return (val: string) => BigInt(val);
      // int8[]: parse as bigint array
      if (oid === 1016)
        return (val: string) =>
          pg.types.arrayParser
            .create(val)
            .parse()
            .map((v: string) => BigInt(v));

      // bytea: return Uint8Array instead of Buffer
      if (oid === 17) {
        const byteaParser = pg.types.getTypeParser(oid, format);
        return (val: string) => new Uint8Array(byteaParser(val));
      }
      // bytea: array
      if (oid === 1001) {
        const byteaArrayParser = pg.types.getTypeParser(oid, format);
        return (val: string) =>
          byteaArrayParser(val).map((v: any) => new Uint8Array(v));
      }

      // point: return string instead of {x, y}
      if (oid === 600) return stringParser;
      // point[]: parse as string array
      if (oid === 1017) return arrayStringParser;

      // circle: return string instead of {x, y, radius}
      if (oid === 718) return stringParser;
      // circle[]: parse as string array
      if (oid === 719) return arrayStringParser;

      // date: return string instead of Date
      if (oid === 1082) return stringParser;
      // date[]: parse as string array
      if (oid === 1182) return arrayStringParser;

      // timestamp: return string instead of Date
      if (oid === 1114) return stringParser;
      // timestamp[]: parse as string array
      if (oid === 1115) return arrayStringParser;

      // interval: return string instead of {years, months, days}
      if (oid === 1186) return stringParser;
      // interval[]: parse as string array
      if (oid === 1187) return arrayStringParser;

      // numeric/decimal: return string
      if (oid === 1700) return stringParser;
      // numeric[]: parse as string array
      if (oid === 1231) return arrayStringParser;

      // pg_lsn[]: parse as string array
      if (oid === 3221) return arrayStringParser;

      // pg_snapshot[]: parse as string array
      if (oid === 5039) return arrayStringParser;

      // bit[]: parse as string array
      if (oid === 1561) return arrayStringParser;

      // varbit[]: parse as string array
      if (oid === 1563) return arrayStringParser;

      // For other types, use default parsers
      return pg.types.getTypeParser(oid, format);
    },
  };
}

/**
 * PGLite mapping
 *
 * Example:
 *
 * ```
 * import { PGlite } from "@electric-sql/pglite";
 *
 * new PGlite({
 *   parsers: createPgliteParsers(),
 * })
 * ```
 */
export function createPgliteParsers() {
  return {
    // int8/serial8: return bigint instead of string
    20: (val: string) => BigInt(val),
    // timestamp: return string instead of Date
    1114: (val: string) => val,
    // date: return string instead of Date
    1082: (val: string) => val,
  };
}

/**
 * Porsager/postgres mapping
 *
 * Example:
 * ```
 * import postgres from "postgres";
 *
 * postgres({
 *   ...options,
 *   types: createNpmPostgresTypes(),
 * });
 * ```
 */
export function createNpmPostgresTypes() {
  return {
    bigint: {
      to: 20,
      from: [20],
      serialize: (x: bigint) => x.toString(),
      parse: (x: string) => BigInt(x),
    },
    date: {
      to: 1184,
      from: [1114, 1082],
      serialize: (x: Date | string) =>
        x instanceof Date ? x.toISOString() : x,
      parse: (x: string) => x,
    },
    bytea: {
      to: 17,
      from: [17],
      serialize: (x: Uint8Array) => "\\x" + Buffer.from(x).toString("hex"),
      parse: (x: string) => new Uint8Array(Buffer.from(x.slice(2), "hex")),
    },
  };
}
