import {
  createNpmPostgresTypes,
  PGUNIFIED_TYPE_MAPPING,
} from "pg-unified-mapping";
import postgres from "postgres";
import { afterEach, beforeAll, beforeEach, describe, it } from "vitest";
import { startContainer } from "./test-container.ts";
import { runMappingTest } from "./test-helper.ts";
import { getTestTable } from "./test-table.ts";

/**
 * Sloppy monkey patch for this https://github.com/porsager/postgres/issues/471
 */
const monkeyPatchArrayInference = (
  sql: ReturnType<typeof postgres>,
): ReturnType<typeof postgres> => {
  const inferPostgresParamType = (value: unknown): number => {
    if (value instanceof Date) return 1184;
    if (value instanceof Uint8Array) return 17;
    if (value === true || value === false) return 16;
    if (typeof value === "bigint") return 20;
    if (Array.isArray(value)) return inferPostgresParamType(value[0]);
    return 0;
  };

  const typeArrayMap = (sql.options as any).shared?.typeArrayMap as
    | Record<number, number>
    | undefined;
  const patchParam = (param: unknown) => {
    if (!Array.isArray(param)) return param;

    const inferredType = inferPostgresParamType(param);
    const arrayOid = typeArrayMap?.[inferredType];
    return arrayOid ? sql.typed(param, arrayOid) : param;
  };

  const wrappedSql = ((strings: unknown, ...args: unknown[]) => {
    if (Array.isArray((strings as any)?.raw)) {
      return (sql as any)(strings as any, ...args.map(patchParam));
    }
    return (sql as any)(strings as any, ...args);
  }) as ReturnType<typeof postgres>;

  Object.assign(wrappedSql, sql);

  const originalUnsafe = sql.unsafe.bind(sql);

  wrappedSql.unsafe = ((statement, paramsOrOptions, queryOptions) => {
    if (Array.isArray(paramsOrOptions)) {
      const patchedParams = paramsOrOptions.map(patchParam);
      return originalUnsafe(statement, patchedParams as any, queryOptions);
    }

    return originalUnsafe(statement, paramsOrOptions as any, queryOptions);
  }) as typeof wrappedSql.unsafe;

  return wrappedSql;
};

beforeAll(async () => {
  process.env.TZ = "Europe/Helsinki";
  await startContainer();
});

describe("npm:postgres unified type mapping", () => {
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
          types: createNpmPostgresTypes(),
        });

        // Enable the monkey patch for array inference
        // sql = monkeyPatchArrayInference(sql);

        await sql`SELECT 1`;
        return;
      } catch (er) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    throw new Error("Failed to connect to PostgreSQL after multiple attempts");
  }, 120000);

  afterEach(async () => {
    await sql?.end();
  }, 30000);

  it("npm:pg insert and select all types round-trip correctly", async () => {
    await runMappingTest({
      table: getTestTable({ skipPorsager: true }),
      mapping: PGUNIFIED_TYPE_MAPPING,
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
