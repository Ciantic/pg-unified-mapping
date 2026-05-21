import { PGlite } from "@electric-sql/pglite";
import {
  createPgliteParsers,
  PGUNIFIED_TYPE_MAPPING,
} from "pg-unified-mapping";
import { beforeAll, describe, it } from "vitest";
import { runMappingTest } from "./test-helper.ts";
import { getTestTable } from "./test-table.ts";

beforeAll(async () => {
  process.env.TZ = "Europe/Helsinki";
});

describe("npm:@electric-sql/pglite unified type mapping", () => {
  it("npm:@electric-sql/pglite insert and select all types round-trip correctly", async () => {
    const pglite = new PGlite({
      parsers: createPgliteParsers(),
    });
    await runMappingTest({
      table: getTestTable({ skipPgLite: true }),
      mapping: PGUNIFIED_TYPE_MAPPING,
      exec: async (sql) => {
        await pglite.exec(sql);
      },
      query: async (sql, params) => {
        const res = await pglite.query(sql, params);
        return { rows: res.rows as Record<string, any>[] };
      },
    });
  });
});
