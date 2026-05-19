import { PGUNIFIED_TYPE_MAPPING } from "pg-unified-mapping";
import { Connection } from "postgrejs";
import { afterEach, beforeAll, beforeEach, describe, it } from "vitest";
import { startContainer } from "./test-container.ts";
import { runMappingTest } from "./test-helper.ts";
import { TABLE } from "./test-table.ts";

beforeAll(async () => {
  await startContainer();
});

describe("npm:postgrejs unified type mapping", () => {
  let conn: Connection;

  beforeEach(async () => {
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
    await runMappingTest({
      table: TABLE,
      mapping: PGUNIFIED_TYPE_MAPPING,
      exec: async (sql) => {
        await conn.query(sql);
      },
      query: async (sql, params) => {
        const res = await conn.query(sql, {
          params: params || [],
        });
        const rows = res.rows || [];
        return { rows };
      },
    });
  });
});
