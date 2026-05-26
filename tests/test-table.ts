// Test table for unified mapping

type TestTableEntry = {
  type: string;
  input: any;
  output?: any;
  skipPorsager?: string;
  skipPgLite?: string;
  skipPg?: string;
  skipPostgreJS?: string;
  skipDuckDB?: string;
  note?: string;
};

export type TestTable = Record<string, TestTableEntry>;

// prettier-ignore
const TABLE = {
  // Numeric types ----------------------------------------------------------------------
  test_int2_n: { type: "int2", input: 100 },
  test_int2_b: { type: "int2", input: 100n, output: 100 },
  test_int2_s: { type: "int2", input: "100", output: 100 },
  test_int2_arr: { type: "int2[]", input: [1, 2, 3] },
  test_int2_arr2: { type: "int2[][]", input: [[1, 2, 3], [4, 5, 6]] },
  
  test_int4_n: { type: "int4", input: 200000 },
  test_int4_b: { type: "int4", input: 200000n, output: 200000 },
  test_int4_s: { type: "int4", input: "200000", output: 200000 },
  test_int4_arr: { type: "int4[]", input: [1, 2, 3] },
  
  test_int8_n: { type: "int8", input: 1234, output: 1234n }, 
  test_int8_b: { type: "int8", input: 123456789012345678n, output: 123456789012345678n },
  test_int8_s: { type: "int8", input: "123456789012345678", output: 123456789012345678n },
  test_int8_arr: { type: "int8[]", input: [1n, 2n, 3n], 
    skipPorsager: "[see array inference bug](https://github.com/porsager/postgres/issues/471)",
  },

  test_serial2_n: { type: "serial2", input: 1234, skipDuckDB: "no support" },
  test_serial2_b: { type: "serial2", input: 1234n, output: 1234, skipDuckDB: "no support" },
  test_serial2_s: { type: "serial2", input: "1234", output: 1234, skipDuckDB: "no support" },

  test_serial4_n: { type: "serial4", input: 12345, skipDuckDB: "no support" },
  test_serial4_b: { type: "serial4", input: 12345n, output: 12345, skipDuckDB: "no support" },
  test_serial4_s: { type: "serial4", input: "12345", output: 12345, skipDuckDB: "no support" },

  test_serial8_n: { type: "serial8", input: 1234, output: 1234n, skipDuckDB: "no support" }, 
  test_serial8_b: { type: "serial8", input: 123456789012345678n, output: 123456789012345678n, skipDuckDB: "no support" },
  test_serial8_s: { type: "serial8", input: "123456789012345678", output: 123456789012345678n, skipDuckDB: "no support" },

  test_float4_n: { type: "float4", input: 1.5 },
  test_float4_b: { type: "float4", input: 1234n, output: 1234 },
  test_float4_s: { type: "float4", input: "1.5", output: 1.5 },
  test_float4_arr: { type: "float4[]", input: [1, 2, 3] },

  test_float8_n: { type: "float8", input: 3.14159 },
  test_float8_b: { type: "float8", input: 1234n, output: 1234 },
  test_float8_s: { type: "float8", input: "3.14159", output: 3.14159 },
  test_float8_arr: { type: "float8[]", input: [1.123, 2.223, 3.3232] },

  test_decimal_n: { type: "decimal", input: 12345.67, output: "12345.67" },
  test_decimal_s: { type: "decimal", input: "12345.67" },
  test_decimal_b: { type: "decimal", input: 12341234n, output: "12341234" },
  test_decimal_arr: { type: "decimal(10,2)[]", input: ["10.55", "20.75"] },
  test_decimal_ps: { type: "decimal(10, 2)", input: "12345.67" },
  test_decimal_ps_arr: { type: "decimal(10,2)[]", input: ["12345.67", "89012.34"] },

  test_money: { type: "money", input: "$12.34", skipDuckDB: "no support" },
  test_money_arr: { type: "money[]", input: ["$12.34", "$56.78"], skipDuckDB: "no support" },

  // Character types ------------------------------------------------------------------------
  test_text: { type: "text", input: "hello world" },
  test_text_arr: { type: "text[]", input: ["hello", "world"] },

  test_char: { type: "char(5)", input: "a".repeat(5) },
  test_char_arr: { type: "char(5)[]", input: ["a".repeat(5), "b".repeat(5)] },

  test_varchar: { type: "varchar(255)", input: "hello" },
  test_varchar_arr: { type: "varchar(255)[]", input: ["hello", "world"] },

  // Binary types ------------------------------------------------------------------------
  test_bytea: { type: "bytea", input: Uint8Array.from([0xde, 0xad, 0xbe, 0xef]) },
  test_bytea_arr: { type: "bytea[]", input: [Uint8Array.from([0xde, 0xad]), Uint8Array.from([0xbe, 0xef])], 
    skipPorsager: "[see array inference bug](https://github.com/porsager/postgres/issues/471)", 
  },

  // Date/Time types ------------------------------------------------------------------------
  test_timestamp: { type: "timestamp", input: "2024-06-15 00:00:00" },
  test_timestamp_nano: { type: "timestamp", input: "2024-06-15 01:02:03.123457" },
  test_timestamp_t: { type: "timestamp", input: "2024-06-15T00:00:00", output: "2024-06-15 00:00:00" },
  test_timestamp_arr: { type: "timestamp[]", input: ["2024-06-15 00:00:00", "2024-06-16 00:00:00"] },

  test_timestamptz: { type: "timestamptz", input: new Date("2024-06-15T12:34:56Z") },
  test_timestamptz_millis: { type: "timestamptz", input: new Date("2024-06-15T12:34:56.146Z") },
  test_timestamptz_arr: { type: "timestamptz[]", input: [new Date("2024-06-15T12:34:56Z"), new Date("2024-06-16T12:34:56Z")], 
    skipPorsager: "[see array inference bug](https://github.com/porsager/postgres/issues/471)",
  },

  test_date: { type: "date", input: "2024-06-15" },
  test_date_str: { type: "date", input: "2024-06-15" },
  test_date_arr: { type: "date[]", input: ["2024-06-15", "2024-06-16"] },

  test_time: { type: "time", input: "12:34:56" },
  test_time_arr: { type: "time[]", input: ["12:34:56", "23:45:01"] },
  test_timetz: { type: "timetz", input: "12:34:56+00" },
  test_timetz_arr: { type: "timetz[]", input: ["12:34:56+00", "23:45:01+00"] },
  test_interval: { type: "interval", input: "1 year 2 mons 3 days" },
  test_interval_arr: { type: "interval[]", input: ["1 year", "2 mons"] },

  // Boolean type ------------------------------------------------------------------------
  test_boolean: { type: "boolean", input: true },
  test_boolean_arr: { type: "boolean[]", input: [true, false, true], skipPorsager: "[see array inference bug](https://github.com/porsager/postgres/issues/471)", },

  // UUID type ------------------------------------------------------------------------
  test_uuid: { type: "uuid", input: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" },
  test_uuid_arr: { type: "uuid[]", input: ["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"] },

  // JSON types ------------------------------------------------------------------------
  test_jsonb: { type: "jsonb", input: { key: "value", num: 42 }, skipDuckDB: "no support" },
  test_jsonb_arr: { type: "jsonb[]", input: [{ key: "value1" }, { key: "value2" }], skipDuckDB: "no support" },
  test_json: { type: "json", input: { arr: [1, 2, 3] } },
  test_json_arr: { type: "json[]", input: [{ arr: [1, 2] }, { arr: [3, 4] }], skipDuckDB: "no support (?)" },

  // Network address types -------------------------------------------------------------------
  test_inet: { type: "inet", input: "192.168.1.1", skipDuckDB: "returns DuckDBStructValue not string" },
  test_inet_arr: { type: "inet[]", input: ["192.168.1.1", "192.168.1.2"], skipDuckDB: "returns DuckDBStructValue not string" },

  test_cidr: { type: "cidr", input: "192.168.1.0/24", skipDuckDB: "no support" },
  test_cidr_arr: { type: "cidr[]", input: ["192.168.1.0/24", "178.0.0.1/32"], skipDuckDB: "no support" },

  test_macaddr: { type: "macaddr", input: "08:00:2b:01:02:03", skipDuckDB: "no support" },
  test_macaddr_arr: { type: "macaddr[]", input: ["08:00:2b:01:02:03", "08:00:2b:01:02:04"], skipDuckDB: "no support" },
  
  test_macaddr8: { type: "macaddr8", input: "08:00:2b:01:02:03:04:05", skipDuckDB: "no support" },
  test_macaddr8_arr: { type: "macaddr8[]", input: ["08:00:2b:01:02:03:04:05", "08:00:2b:01:02:03:04:06"], skipDuckDB: "no support" },

  // Text search types ----------------------------------------------------------------------
  test_tsvector: { type: "tsvector", input: "'a' 'cat' 'fat' 'mat' 'on' 'sat'", skipDuckDB: "no support" },
  test_tsvector_arr: { type: "tsvector[]", input: ["'a' 'cat'", "'fat' 'mat'"], skipDuckDB: "no support" },
  
  test_tsquery: { type: "tsquery", input: "'fat' & 'cat'", skipDuckDB: "no support" },
  test_tsquery_arr: { type: "tsquery[]", input: ["'fat' & 'cat'", "'mat' & 'sat'"], skipDuckDB: "no support" },

  // XML type
  test_xml: { type: "xml", input: "<root><item>test</item></root>", skipDuckDB: "no support" },
  test_xml_arr: { type: "xml[]", input: ["<root><item>test1</item></root>", "<root><item>test2</item></root>"], skipDuckDB: "no support" },

  // Geometric types ------------------------------------------------------------------------
  test_point: { type: "point", input: "(1,2)", skipDuckDB: "no support" },
  test_point_arr: { type: "point[]", input: ["(1,2)", "(3,4)"], skipDuckDB: "no support" },

  test_line: { type: "line", input: "{1,2,3}", skipDuckDB: "no support" },
  test_line_arr: { type: "line[]", input: ["{1,2,3}", "{4,5,6}"], skipDuckDB: "no support" },
  
  test_lseg: { type: "lseg", input: "[(1,2),(3,4)]", skipDuckDB: "no support" },
  test_lseg_arr: { type: "lseg[]", input: ["[(1,2),(3,4)]", "[(5,6),(7,8)]"], skipDuckDB: "no support" },
  
  test_box: { type: "box", input: "(3,4),(1,2)", skipDuckDB: "no support" },
  test_box_arr: { type: "box[]", input: ["(3,4),(1,2)", "(7,8),(5,6)"], skipDuckDB: "no support", skipPg: "pg has probably bug in prepareValue, it can't format the INSERT correctly" },
  
  test_path: { type: "path", input: "[(1,2),(3,4),(5,6)]", skipDuckDB: "no support" },
  test_path_arr: { type: "path[]", input: ["[(1,2),(3,4),(5,6)]", "[(7,8),(9,10),(11,12)]"], skipDuckDB: "no support" },
  
  test_polygon: { type: "polygon", input: "((1,2),(3,4),(5,6))", skipDuckDB: "no support" },
  test_polygon_arr: { type: "polygon[]", input: ["((1,2),(3,4),(5,6))", "((7,8),(9,10),(11,12))"], skipDuckDB: "no support" },
  
  test_circle: { type: "circle", input: "<(1,2),3>", skipDuckDB: "no support" },
  test_circle_arr: { type: "circle[]", input: ["<(1,2),3>", "<(4,5),6>"], skipDuckDB: "no support" },

  // Object identifier / system types ----------------------------------------------------------
  test_pg_lsn: { type: "pg_lsn", input: "0/16A8F80", skipDuckDB: "no support" },
  test_pg_lsn_arr: { type: "pg_lsn[]", input: ["0/16A8F80", "0/16A8F81"], skipDuckDB: "no support" },

  test_pg_snapshot: { type: "pg_snapshot", input: "100:200:", skipDuckDB: "no support" },
  test_pg_snapshot_arr: { type: "pg_snapshot[]", input: ["100:200:", "300:400:"], skipDuckDB: "no support" },

  // Bit types ----------------------------------------------------------------------------
  test_bit: { type: "bit(3)", input: "101", skipDuckDB: "no support" },
  test_bit_arr: { type: "bit(3)[]", input: ["101", "110"], skipDuckDB: "no support" },

  test_varbit: { type: "varbit(16)", input: "10011010", skipDuckDB: "no support" },
  test_varbit_arr: { type: "varbit(16)[]", input: ["10011010", "11110000"], skipDuckDB: "no support" },

  // Nullness ----------------------------------------------------------------------------
  // - pglite has bug, can't handle nulls in array: https://github.com/electric-sql/pglite/issues/997
  // - porsager has feature, can't handle undefined input for non-nullable columns
  test_null: { type: "int4", input: null, output: null },
  test_arr_null: { 
    type: "text[]", input: [null, "hello", null], output: [null, "hello", null], 
    skipPorsager: "it just fails, didn't figure out yet why",
    skipDuckDB: "no support for null elements in arrays",
  },
  test2_null: { 
    type: "text", input: undefined, output: null, 
    skipPorsager: "documented behavior of porsager/postgres" 
  },
  test2_arr_null: { 
    type: "text[]", input: [undefined, "hello", undefined], output: [null, "hello", null], 
    skipPorsager: "it just fails, didn't figure out yet why", 
    skipDuckDB: "no support for null elements in arrays",
  },
} satisfies TestTable;

export function getTestTable(
  opts: {
    skipPorsager?: boolean;
    skipPgLite?: boolean;
    skipPg?: boolean;
    skipPostgreJS?: boolean;
    skipDuckDB?: boolean;
  } = {},
): TestTable {
  return Object.fromEntries(
    Object.entries(TABLE as TestTable).filter(([, v]) => {
      if (opts.skipPg && v.skipPg) return false;
      if (opts.skipPorsager && v.skipPorsager) return false;
      if (opts.skipPgLite && v.skipPgLite) return false;
      if (opts.skipPostgreJS && v.skipPostgreJS) return false;
      if (opts.skipDuckDB && v.skipDuckDB) return false;
      return true;
    }),
  );
}
