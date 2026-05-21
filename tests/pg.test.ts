import pg from "pg";
import {
  createPgMapperTypes,
  PGUNIFIED_TYPE_MAPPING,
} from "pg-unified-mapping";
import { afterEach, beforeAll, beforeEach, describe, it } from "vitest";
import { startContainer } from "./test-container.ts";
import { runMappingTest } from "./test-helper.ts";
import { getTestTable } from "./test-table.ts";

beforeAll(async () => {
  process.env.TZ = "Europe/Helsinki";
  await startContainer();
});

describe("npm:pg unified type mapping", () => {
  let client: pg.Client;

  beforeEach(async () => {
    // Retry connection until PostgreSQL is truly ready
    for (let i = 0; i < 30; i++) {
      try {
        client = await new pg.Client({
          host: "localhost",
          port: 5432,
          user: "postgres",
          password: "test",
          database: "test",
          types: createPgMapperTypes(pg),
        }).connect();
        return;
      } catch (er) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    throw new Error("Failed to connect to PostgreSQL after multiple attempts");
  });

  afterEach(async () => {
    try {
      await client?.end();
    } catch {
      // ignore
    }
  }, 30000);

  it("npm:pg insert and select all types round-trip correctly", async () => {
    await runMappingTest({
      table: getTestTable({ skipPg: true }),
      mapping: PGUNIFIED_TYPE_MAPPING,
      exec: async (sql) => {
        await client.query(sql);
      },
      query: async (sql, params) => {
        const res = await client.query(sql, params);
        return { rows: res.rows };
      },
    });
  });
});
