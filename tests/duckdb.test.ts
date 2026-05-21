import {
  DuckDBBlobValue,
  DuckDBDateValue,
  DuckDBDecimalValue,
  DuckDBInstance,
  DuckDBIntervalValue,
  DuckDBListValue,
  DuckDBResultReader,
  DuckDBTimestampTZValue,
  DuckDBTimestampValue,
  DuckDBTimeTZValue,
  DuckDBTimeValue,
  DuckDBTypeId,
  JSDuckDBValueConverter,
  type DuckDBType,
  type DuckDBValue,
  type DuckDBValueConverter,
  type JS,
} from "@duckdb/node-api";
import { PGUNIFIED_TYPE_MAPPING } from "pg-unified-mapping";
import { beforeAll, describe, it } from "vitest";
import { runMappingTest } from "./test-helper.ts";
import { getTestTable } from "./test-table.ts";

beforeAll(async () => {
  process.env.TZ = "Europe/Helsinki";
});

function getBindParamUnified(param: unknown): unknown {
  if (param === null || param === undefined) {
    return null;
  }
  if (param instanceof Date) {
    return new DuckDBTimestampTZValue(BigInt(param.getTime()) * 1000n);
  }
  if (param instanceof Uint8Array) {
    return new DuckDBBlobValue(param);
  }
  if (Array.isArray(param)) {
    return new DuckDBListValue(param.map(getBindParamUnified) as DuckDBValue[]);
  }
  if (typeof param === "bigint") {
    return "" + param;
  }
  if (typeof param === "string") {
    return param;
  }
  return JSON.stringify(param, (k, v) => {
    if (typeof v === "bigint") {
      return "" + v;
    }
    return v;
  });
}

const pgConverter: DuckDBValueConverter<JS> = (
  value: DuckDBValue,
  type: DuckDBType,
  converter: DuckDBValueConverter<JS>,
): JS => {
  if (value === null || value === undefined) return null;
  switch (type.typeId) {
    case DuckDBTypeId.TIMESTAMP:
    case DuckDBTypeId.TIMESTAMP_S:
    case DuckDBTypeId.TIMESTAMP_MS:
    case DuckDBTypeId.TIMESTAMP_NS:
      return (value as DuckDBTimestampValue).toString();
    case DuckDBTypeId.DATE:
      return (value as DuckDBDateValue).toString();
    case DuckDBTypeId.TIME:
      return (value as DuckDBTimeValue).toString();
    case DuckDBTypeId.TIME_TZ:
      return (value as DuckDBTimeTZValue).toString();
    case DuckDBTypeId.INTERVAL:
      return (value as DuckDBIntervalValue)
        .toString()
        .replace(/ months /g, " mons ");
    case DuckDBTypeId.DECIMAL:
      return (value as DuckDBDecimalValue)
        .toString()
        .replace(/(\.\d*?)0+$/, "$1")
        .replace(/\.$/, "");
    case DuckDBTypeId.BLOB:
      return new Uint8Array((value as DuckDBBlobValue).bytes);
    default:
      return JSDuckDBValueConverter(value, type, converter);
  }
};

function getRowObjectsUnified(
  result: DuckDBResultReader,
): Record<string, unknown>[] {
  const colTypes = result.columnTypes();
  const colNames = result.columnNames();
  return result.convertRowObjects(pgConverter).map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => {
        const colType = colTypes[colNames.indexOf(k)];
        if (colType?.alias === "JSON") {
          try {
            return [k, JSON.parse(v as string)];
          } catch {
            // ignore
          }
        }
        return [k, v];
      }),
    ),
  );
}

describe("npm:@duckdb/node-api unified type mapping", () => {
  it("npm:@duckdb/node-api insert and select all types round-trip correctly", async () => {
    const instance = await DuckDBInstance.create(":memory:", {});
    const conn = await instance.connect();
    await runMappingTest({
      table: getTestTable({ skipDuckDB: true }),
      mapping: PGUNIFIED_TYPE_MAPPING,
      exec: async (sql) => {
        await conn.run(sql);
      },
      query: async (sql, params) => {
        let binds = params?.map(getBindParamUnified);
        const res = await conn.runAndReadAll(sql, binds as any);
        const rows = getRowObjectsUnified(res);
        return { rows };
      },
    });
  });
});
