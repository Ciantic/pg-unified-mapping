import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import postgres from "postgres";
import { afterEach, beforeAll, beforeEach, describe, it } from "vitest";
import { startContainer } from "./test-container.ts";
import { runMappingTest } from "./test-helper.ts";
import type { TestTable } from "./test-table.ts";

beforeAll(async () => {
  process.env.TZ = "Europe/Helsinki";
  await startContainer();
});

export const DEFAULTS_TEST_TABLE = {
  test_timestamp: {
    type: "timestamp",
    input: new Date("2024-01-01T12:34:56Z"),
    output_pg: new Date("2024-01-01T12:34:56Z"),
    output_pglite: new Date("2024-01-01T10:34:56Z"),
    output_postgres: new Date("2024-01-01T10:34:56Z"),
  },
  test_timestamp_iso: {
    type: "timestamp",
    input: "2024-01-01 12:34:56",
    output_pg: new Date("2024-01-01T10:34:56Z"),
    output_pglite: new Date("2024-01-01T10:34:56Z"),
    output_postgres: new Date("2024-01-01T08:34:56Z"),
  },
  test_timestamp_tz: {
    type: "timestamptz",
    input: new Date("2024-01-01T12:34:56Z"),
    output_pg: new Date("2024-01-01T12:34:56Z"),
    output_pglite: new Date("2024-01-01T12:34:56Z"),
    output_postgres: new Date("2024-01-01T12:34:56Z"),
  },
  test_timestamp_tz_iso: {
    type: "timestamptz",
    input: "2024-01-01 12:34:56",
    output_pg: new Date("2024-01-01T12:34:56Z"),
    output_pglite: new Date("2024-01-01T10:34:56Z"),
    output_postgres: new Date("2024-01-01T10:34:56Z"),
  },
  test_date: {
    type: "date",
    input: new Date("2024-01-01T00:00:00Z"),
    output_pg: new Date("2023-12-31T22:00:00Z"),
    output_pglite: new Date("2024-01-01T00:00:00Z"),
    output_postgres: new Date("2024-01-01T00:00:00Z"),
  },
  test_date_iso: {
    type: "date",
    input: "2024-01-01",
    output_pg: new Date("2023-12-31T22:00:00Z"),
    output_pglite: new Date("2024-01-01T00:00:00Z"),
    output_postgres: new Date("2024-01-01T00:00:00Z"),
  },
};

function getDefaultsTestTable(type: "pg" | "postgres" | "pglite"): TestTable {
  const outputKey = `output_${type}` as const;
  return Object.fromEntries(
    Object.entries(DEFAULTS_TEST_TABLE).map(([key, value]) => [
      key,
      { type: value.type, input: value.input, output: value[outputKey] },
    ]),
  );
}

describe("default madness", () => {
  let client: pg.Client;

  describe("npm:pg", () => {
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
          }).connect();
          return;
        } catch (er) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      throw new Error(
        "Failed to connect to PostgreSQL after multiple attempts",
      );
    });

    afterEach(async () => {
      try {
        await client?.end();
      } catch {
        // ignore
      }
    }, 30000);

    it("npm:pg default madness", async () => {
      await runMappingTest({
        table: getDefaultsTestTable("pg"),
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

  describe("npm:@electric-sql/pglite", () => {
    it("npm:@electric-sql/pglite default madness", async () => {
      const pglite = new PGlite();
      await runMappingTest({
        table: getDefaultsTestTable("pglite"),
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

  describe("npm:postgres", () => {
    let sql: ReturnType<typeof postgres>;

    beforeEach(async () => {
      // Retry connection until PostgreSQL is truly ready
      for (let i = 0; i < 30; i++) {
        try {
          sql = postgres({
            host: "localhost",
            port: 5432,
            user: "postgres",
            password: "test",
            database: "test",
          });

          // Enable the monkey patch for array inference
          // sql = monkeyPatchArrayInference(sql);

          await sql`SELECT 1`;
          return;
        } catch (er) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      throw new Error(
        "Failed to connect to PostgreSQL after multiple attempts",
      );
    }, 120000);

    afterEach(async () => {
      await sql?.end();
    }, 30000);

    it("npm:postgres default madness", async () => {
      await runMappingTest({
        table: getDefaultsTestTable("postgres"),
        exec: async (statement) => {
          await sql.unsafe(statement).execute();
        },
        query: async (statement, params) => {
          const result = await sql.unsafe(statement, params || []).execute();
          return { rows: [...result] };
        },
      });
    });
  });
});
