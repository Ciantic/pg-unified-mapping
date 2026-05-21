import { PGlite } from "@electric-sql/pglite";
import {
  createPgliteParsers,
  PGUNIFIED_TYPE_MAPPING,
} from "pg-unified-mapping";
import { describe, it } from "vitest";
import { runMappingTest } from "./test-helper.ts";
import { TABLE } from "./test-table.ts";

describe("npm:@electric-sql/pglite unified type mapping", () => {
  it("npm:@electric-sql/pglite insert and select all types round-trip correctly", async () => {
    const filteredTable = Object.fromEntries(
      Object.entries(TABLE).filter(([, v]) => !(v as any).skipPgLite),
    );
    const pglite = new PGlite({
      parsers: createPgliteParsers(),
    });
    await runMappingTest({
      table: filteredTable,
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
