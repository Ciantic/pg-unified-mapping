import { PGUNIFIED_TYPE_MAPPING } from "pg-unified-mapping";
import {
  Connection,
  DataFormat,
  DataTypeOIDs,
  GlobalTypeMap,
  SmartBuffer,
  stringifyArrayLiteral,
} from "postgrejs";
import { afterEach, beforeAll, beforeEach, describe, it } from "vitest";
import { startContainer } from "./test-container.ts";
import { runMappingTest } from "./test-helper.ts";
import { getTestTable } from "./test-table.ts";

beforeAll(async () => {
  process.env.TZ = "Europe/Helsinki";
});

// This mapping is very sloppy, we need to clean this up at somepoint!

function parsePostgresArray(
  s: string,
  opts?: { transform?(v: string): any; separator?: string },
): any[] | undefined {
  if (!s) return undefined;
  const sep = (opts?.separator || ",").substring(0, 1);
  const transform = opts?.transform;
  const len = s.length;
  let idx = 0;
  const out: any[] = [];
  const iterate = (arr: any[]) => {
    let c: string;
    let exactlyValue = false;
    let token = "";
    let quote = "";
    while (idx < len) {
      c = s.charAt(idx++);
      if (!quote) {
        if (!token && c === "{") {
          const a: any[] = [];
          arr.push(a);
          iterate(a);
          continue;
        }
        if (c === "}" || c === sep) {
          if (token) {
            if (token === "NULL" && !exactlyValue) arr.push(null);
            else arr.push(transform ? transform(token) : token);
            exactlyValue = false;
          }
          token = "";
          if (c === "}") return;
          continue;
        }
      }
      if (c === "\\") {
        c = s.charAt(idx++);
        token += c;
        continue;
      }
      if (c === '"' || c === "'") {
        if (quote && quote === c) {
          quote = "";
        } else {
          exactlyValue = true;
          quote = c;
        }
        continue;
      }
      token += c;
    }
  };
  iterate(out);
  return out.length ? out[0] : undefined;
}

function stripArrayDimPrefix(s: string): string {
  return s.replace(/^\[\d+:\d+\]=/, "");
}

beforeAll(async () => {
  await startContainer();
});

describe("npm:postgrejs unified type mapping", () => {
  let conn: Connection;
  const originalItems = [...(GlobalTypeMap as any)._items] as any[];
  const originalItemsByOID = { ...(GlobalTypeMap as any)._itemsByOID };

  beforeEach(async () => {
    // Restore original type mappings
    (GlobalTypeMap as any)._items = originalItems.slice();
    (GlobalTypeMap as any)._itemsByOID = { ...originalItemsByOID };

    // Retry connection until PostgreSQL is truly ready
    for (let i = 0; i < 30; i++) {
      try {
        conn = new Connection({
          host: "localhost",
          port: 5432,
          user: "postgres",
          password: "test",
          database: "test",
        });
        await conn.connect();
        return;
      } catch (er) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    throw new Error("Failed to connect to PostgreSQL after multiple attempts");
  });

  afterEach(async () => {
    try {
      await conn?.close();
    } catch {
      // ignore
    }
  }, 30000);

  it("npm:postgrejs insert and select all types round-trip correctly", async () => {
    // Register "any" encoding type (must be last in _items so determine() checks it first)
    GlobalTypeMap.register({
      name: "any",
      oid: DataTypeOIDs.unknown,
      jsType: "any",

      parseBinary(v: Buffer): string {
        return v.toString("utf8");
      },

      parseText(v: string): any {
        return v;
      },

      encodeText(v: any) {
        if (Array.isArray(v)) {
          const normalized = v.map((item) =>
            item instanceof Date
              ? item.toISOString().replace("T", " ").replace("Z", "+00")
              : item,
          );
          return stringifyArrayLiteral(normalized);
        }
        if (v instanceof Date) {
          return v.toISOString().replace("T", " ").replace("Z", "+00");
        }
        return v.toString();
      },

      isType(v: any): boolean {
        return true;
      },
    });

    GlobalTypeMap.register({
      name: "bytea",
      oid: DataTypeOIDs.bytea,
      jsType: "Uint8Array",

      parseBinary(v: Buffer): Buffer {
        return v;
      },

      encodeBinary(buf: SmartBuffer, v: Buffer | Uint8Array): void {
        if (v instanceof Uint8Array) {
          buf.writeBuffer(Buffer.from(v));
        } else {
          buf.writeBuffer(v);
        }
      },

      parseText(v: string): Uint8Array {
        return new Uint8Array(Buffer.from(v.slice(2), "hex"));
      },

      isType(v: any): boolean {
        return v instanceof Uint8Array;
      },
    });

    // Override determine to route special types correctly
    const oldDetermine = GlobalTypeMap.determine;
    GlobalTypeMap.determine = function (value: any) {
      if (Array.isArray(value)) {
        return DataTypeOIDs.unknown;
      }
      if (value instanceof Date) {
        return DataTypeOIDs.timestamptz;
      }
      if (value instanceof Uint8Array) {
        return DataTypeOIDs.bytea;
      }
      if (
        typeof value === "object" &&
        value !== null &&
        !(value instanceof Buffer)
      ) {
        return DataTypeOIDs.jsonb;
      }
      return oldDetermine.call(this, value);
    };

    // Override parseText for types that produce wrong output per unified mapping
    const arrayOf = (
      oid: number,
      arrayOid: number,
      parse: (v: string) => any,
    ) => {
      GlobalTypeMap.register({
        name: `_override_${oid}`,
        oid: arrayOid,
        jsType: "array",
        parseBinary(v: Buffer): Buffer {
          return v;
        },
        parseText(v: string): any {
          return parsePostgresArray(stripArrayDimPrefix(v), {
            transform: parse,
          });
        },
        isType(v: any): boolean {
          return Array.isArray(v);
        },
      });
    };

    // int8: always return bigint
    GlobalTypeMap.register({
      ...GlobalTypeMap.get(DataTypeOIDs.int8),
      parseText(v: string) {
        return BigInt(v);
      },
    });
    arrayOf(DataTypeOIDs.int8, DataTypeOIDs._int8, (v) => BigInt(v));

    // numeric: return string
    const numericType = GlobalTypeMap.get(DataTypeOIDs.numeric);
    GlobalTypeMap.register({
      ...numericType,
      parseText(v: string) {
        return v;
      },
    });
    arrayOf(DataTypeOIDs.numeric, DataTypeOIDs._numeric, (v) => v);

    // timestamp: return string instead of Date
    GlobalTypeMap.register({
      ...GlobalTypeMap.get(DataTypeOIDs.timestamp),
      parseText(v: string) {
        return v;
      },
    });
    arrayOf(DataTypeOIDs.timestamp, DataTypeOIDs._timestamp, (v) => v);

    // date: return string instead of Date
    GlobalTypeMap.register({
      ...GlobalTypeMap.get(DataTypeOIDs.date),
      parseText(v: string) {
        return v;
      },
    });
    arrayOf(DataTypeOIDs.date, DataTypeOIDs._date, (v) => v);

    // time: return string
    GlobalTypeMap.register({
      ...GlobalTypeMap.get(DataTypeOIDs.time),
      parseText(v: string) {
        return v;
      },
    });
    arrayOf(DataTypeOIDs.time, DataTypeOIDs._time, (v) => v);

    // Geometric types: return string instead of object
    const geomOids = [
      [DataTypeOIDs.point, DataTypeOIDs._point],
      [DataTypeOIDs.lseg, DataTypeOIDs._lseg],
      [DataTypeOIDs.box, DataTypeOIDs._box],
      [DataTypeOIDs.circle, DataTypeOIDs._circle],
    ] as const;
    for (const [oid, arrOid] of geomOids) {
      const orig = GlobalTypeMap.get(oid);
      GlobalTypeMap.register({
        ...orig,
        parseText(v: string) {
          return v;
        },
      });
      arrayOf(oid, arrOid, (v) => v);
    }

    // Override array parsing for types where scalar output is already correct
    // Remove elementsOID so getParsers doesn't wrap with internal parsePostgresArray
    const arrayTypesToFix = [
      [DataTypeOIDs._int4, DataTypeOIDs.int4, (v: string) => parseInt(v, 10)],
      [DataTypeOIDs._text, DataTypeOIDs.text, (v: string) => v],
      [DataTypeOIDs._float8, DataTypeOIDs.float8, (v: string) => parseFloat(v)],
      [
        DataTypeOIDs._bool,
        DataTypeOIDs.bool,
        (v: string) => v === "t" || v === "true",
      ],
      [
        DataTypeOIDs._timestamptz,
        DataTypeOIDs.timestamptz,
        (v: string) => new Date(v),
      ],
    ] as const;
    for (const [arrOid, elemOid, parse] of arrayTypesToFix) {
      const orig = GlobalTypeMap.get(arrOid);
      GlobalTypeMap.register({
        ...orig,
        elementsOID: undefined as any,
        parseText(v: string): any {
          return parsePostgresArray(stripArrayDimPrefix(v), {
            transform: parse,
          });
        },
      });
    }

    await runMappingTest({
      table: getTestTable({ skipPostgreJS: true }),
      mapping: PGUNIFIED_TYPE_MAPPING,
      exec: async (sql) => {
        await conn.query(sql);
      },
      query: async (sql, params) => {
        const res = await conn.query(sql, {
          params: params || [],
          objectRows: true,
          columnFormat: DataFormat.text,
        });
        const rows = res.rows || [];
        return { rows };
      },
    });
  });
});
