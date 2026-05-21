# pg-unified-mapping

This library provides a unified type mapping for PostgreSQL types across different JavaScript PostgreSQL clients:

Currently supported clients:

- [npm:pg](https://www.npmjs.com/package/pg)
- [npm:postgres](https://www.npmjs.com/package/postgres)
- [npm:@electric-sql/pglite](https://www.npmjs.com/package/@electric-sql/pglite)

## Recommendation

Use `pg` and `pglite` if you can, mapping is easiest with those and has least quirks.

## Usage

Open [src/mapper.ts](src/mapper.ts) to see the full mapping implementation, and copy the relevant function to your project.

### npm:pg

```typescript
import pg from "pg";

const client = await new pg.Client({
  host: "localhost", 
  types: createPgMapperTypes(pg), // Copy this function to your project
});
```

### npm:@electric-sql/pglite

```typescript
import { PGlite } from "@electric-sql/pglite";

new PGlite({
  parsers: createPgliteParsers(), // Copy this function to your project
});
```

### npm:postgres

```typescript
import postgres from "postgres";

postgres({
  host: "localhost",
  types: createNpmPostgresTypes(), // Copy this function to your project
});
```

postgres parser has difficulty with arrays, I've made a monkey patch `monkeyPatchArrayInference` but it would best if it was fixed in the library itself, see [the bug](https://github.com/porsager/postgres/issues/471).

### npm:postgrejs

Forget it for now! I have it as a test case, but mapping is so difficult that what ever for now.

## Known quirks


* npm:@electric-sql/pglite &mdash; type <code>text[]</code> fails with input <code>[null, "hello", null]</code> [see reported bug](https://github.com/electric-sql/pglite/issues/997)
* npm:@electric-sql/pglite &mdash; type <code>text[]</code> fails with input <code>[undefined, "hello", undefined]</code> [see reported bug](https://github.com/electric-sql/pglite/issues/997)
* npm:postgres &mdash; type <code>boolean[]</code> fails with input <code>[true, false, true]</code> [see array inference bug](https://github.com/porsager/postgres/issues/471)
* npm:postgres &mdash; type <code>int8[]</code> fails with input <code>[1n, 2n, 3n]</code> [see array inference bug](https://github.com/porsager/postgres/issues/471)
* npm:postgres &mdash; type <code>text</code> fails with input <code>undefined</code> documented behavior of porsager/postgres
* npm:postgres &mdash; type <code>text[]</code> fails with input <code>[null, "hello", null]</code> it just fails, didn't figure out yet why
* npm:postgres &mdash; type <code>text[]</code> fails with input <code>[undefined, "hello", undefined]</code> it just fails, didn't figure out yet why
* npm:postgres &mdash; type <code>timestamptz[]</code> fails with input <code>[Date("2024-06-15T12:34:56.000Z"), Date("2024-06-16T12:34:56.000Z")]</code> [see array inference bug](https://github.com/porsager/postgres/issues/471)


## Type mapping

Type mapping is also defined as const strings in [src/types.ts](src/types.ts), this could be used to e.g. infer Zod or Valibot or Kysely schema automatically.

<table>
<thead>
<tr>
  <th>Postgres Type</th>
  <th>Input type (INSERT or UPDATE input)</th>
  <th>Output type (SELECT output)</th>
</tr>
</thead>
<tbody>

<tr>
<td><code>int2</code></td>
<td><code>string | number | bigint</code></td>
<td><code>number</code></td>
</tr>

<tr>
<td><code>int4</code></td>
<td><code>string | number | bigint</code></td>
<td><code>number</code></td>
</tr>

<tr>
<td><code>int8</code></td>
<td><code>string | number | bigint</code></td>
<td><code>bigint</code></td>
</tr>

<tr>
<td><code>serial2</code></td>
<td><code>string | number | bigint</code></td>
<td><code>number</code></td>
</tr>

<tr>
<td><code>serial4</code></td>
<td><code>string | number | bigint</code></td>
<td><code>number</code></td>
</tr>

<tr>
<td><code>serial8</code></td>
<td><code>string | number | bigint</code></td>
<td><code>bigint</code></td>
</tr>

<tr>
<td><code>float4</code></td>
<td><code>string | number | bigint</code></td>
<td><code>number</code></td>
</tr>

<tr>
<td><code>float8</code></td>
<td><code>string | number | bigint</code></td>
<td><code>number</code></td>
</tr>

<tr>
<td><code>decimal</code></td>
<td><code>string | number | bigint</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>money</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>text</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>varchar</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>char</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>bytea</code></td>
<td><code>uint8Array</code></td>
<td><code>uint8Array</code></td>
</tr>

<tr>
<td><code>timestamp</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>timestamptz</code></td>
<td><code>dateObject</code></td>
<td><code>dateObject</code></td>
</tr>

<tr>
<td><code>date</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>time</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>timetz</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>interval</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>boolean</code></td>
<td><code>boolean</code></td>
<td><code>boolean</code></td>
</tr>

<tr>
<td><code>uuid</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>jsonb</code></td>
<td><code>object</code></td>
<td><code>object</code></td>
</tr>

<tr>
<td><code>json</code></td>
<td><code>object</code></td>
<td><code>object</code></td>
</tr>

<tr>
<td><code>inet</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>cidr</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>macaddr</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>macaddr8</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>bit</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>varbit</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>tsvector</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>tsquery</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>xml</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>point</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>line</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>lseg</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>box</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>path</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>polygon</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>circle</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>xmin</code></td>
<td><code>number</code></td>
<td><code>number</code></td>
</tr>

<tr>
<td><code>pg_lsn</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>

<tr>
<td><code>pg_snapshot</code></td>
<td><code>string</code></td>
<td><code>string</code></td>
</tr>
</tbody>
</table>

## Test cases

To create more test cases, edit [tests/test-table.ts](tests/test-table.ts).

<table>
<thead>
<tr>
  <th>Postgres Type</th>
  <th>Input (INSERT or UPDATE input)</th>
  <th>Output (SELECT output)</th>
</tr>
</thead>
<tbody>

<tr>
<td><code>int2</code> </td>
<td><code>100</code></td>
<td><code>100</code></td>
</tr>

<tr>
<td><code>int2</code> </td>
<td><code>100n</code></td>
<td><code>100</code></td>
</tr>

<tr>
<td><code>int2</code> </td>
<td><code>"100"</code></td>
<td><code>100</code></td>
</tr>

<tr>
<td><code>int4</code> </td>
<td><code>200000</code></td>
<td><code>200000</code></td>
</tr>

<tr>
<td><code>int4</code> </td>
<td><code>200000n</code></td>
<td><code>200000</code></td>
</tr>

<tr>
<td><code>int4</code> </td>
<td><code>"200000"</code></td>
<td><code>200000</code></td>
</tr>

<tr>
<td><code>int8</code> </td>
<td><code>1234</code></td>
<td><code>1234n</code></td>
</tr>

<tr>
<td><code>int8</code> </td>
<td><code>123456789012345678n</code></td>
<td><code>123456789012345678n</code></td>
</tr>

<tr>
<td><code>int8</code> </td>
<td><code>"123456789012345678"</code></td>
<td><code>123456789012345678n</code></td>
</tr>

<tr>
<td><code>serial2</code> </td>
<td><code>1234</code></td>
<td><code>1234</code></td>
</tr>

<tr>
<td><code>serial2</code> </td>
<td><code>1234n</code></td>
<td><code>1234</code></td>
</tr>

<tr>
<td><code>serial2</code> </td>
<td><code>"1234"</code></td>
<td><code>1234</code></td>
</tr>

<tr>
<td><code>serial4</code> </td>
<td><code>12345</code></td>
<td><code>12345</code></td>
</tr>

<tr>
<td><code>serial4</code> </td>
<td><code>12345n</code></td>
<td><code>12345</code></td>
</tr>

<tr>
<td><code>serial4</code> </td>
<td><code>"12345"</code></td>
<td><code>12345</code></td>
</tr>

<tr>
<td><code>serial8</code> </td>
<td><code>1234</code></td>
<td><code>1234n</code></td>
</tr>

<tr>
<td><code>serial8</code> </td>
<td><code>123456789012345678n</code></td>
<td><code>123456789012345678n</code></td>
</tr>

<tr>
<td><code>serial8</code> </td>
<td><code>"123456789012345678"</code></td>
<td><code>123456789012345678n</code></td>
</tr>

<tr>
<td><code>float4</code> </td>
<td><code>1.5</code></td>
<td><code>1.5</code></td>
</tr>

<tr>
<td><code>float4</code> </td>
<td><code>1234n</code></td>
<td><code>1234</code></td>
</tr>

<tr>
<td><code>float4</code> </td>
<td><code>"1.5"</code></td>
<td><code>1.5</code></td>
</tr>

<tr>
<td><code>float8</code> </td>
<td><code>3.14159</code></td>
<td><code>3.14159</code></td>
</tr>

<tr>
<td><code>float8</code> </td>
<td><code>1234n</code></td>
<td><code>1234</code></td>
</tr>

<tr>
<td><code>float8</code> </td>
<td><code>"3.14159"</code></td>
<td><code>3.14159</code></td>
</tr>

<tr>
<td><code>decimal</code> </td>
<td><code>12345.67</code></td>
<td><code>"12345.67"</code></td>
</tr>

<tr>
<td><code>decimal</code> </td>
<td><code>"12345.67"</code></td>
<td><code>"12345.67"</code></td>
</tr>

<tr>
<td><code>decimal</code> </td>
<td><code>12341234n</code></td>
<td><code>"12341234"</code></td>
</tr>

<tr>
<td><code>money</code> </td>
<td><code>"$12.34"</code></td>
<td><code>"$12.34"</code></td>
</tr>

<tr>
<td><code>text</code> </td>
<td><code>"hello world"</code></td>
<td><code>"hello world"</code></td>
</tr>

<tr>
<td><code>bytea</code> </td>
<td><code>Uint8Array([222, 173, 190, 239])</code></td>
<td><code>Uint8Array([222, 173, 190, 239])</code></td>
</tr>

<tr>
<td><code>timestamp</code> </td>
<td><code>"2024-06-15 00:00:00"</code></td>
<td><code>"2024-06-15 00:00:00"</code></td>
</tr>

<tr>
<td><code>timestamp</code> </td>
<td><code>"2024-06-15 01:02:03.123457"</code></td>
<td><code>"2024-06-15 01:02:03.123457"</code></td>
</tr>

<tr>
<td><code>timestamp</code> </td>
<td><code>"2024-06-15T00:00:00"</code></td>
<td><code>"2024-06-15 00:00:00"</code></td>
</tr>

<tr>
<td><code>timestamptz</code> </td>
<td><code>Date("2024-06-15T12:34:56.000Z")</code></td>
<td><code>Date("2024-06-15T12:34:56.000Z")</code></td>
</tr>

<tr>
<td><code>timestamptz</code> </td>
<td><code>Date("2024-06-15T12:34:56.146Z")</code></td>
<td><code>Date("2024-06-15T12:34:56.146Z")</code></td>
</tr>

<tr>
<td><code>date</code> </td>
<td><code>"2024-06-15"</code></td>
<td><code>"2024-06-15"</code></td>
</tr>

<tr>
<td><code>date</code> </td>
<td><code>"2024-06-15"</code></td>
<td><code>"2024-06-15"</code></td>
</tr>

<tr>
<td><code>time</code> </td>
<td><code>"12:34:56"</code></td>
<td><code>"12:34:56"</code></td>
</tr>

<tr>
<td><code>timetz</code> </td>
<td><code>"12:34:56+00"</code></td>
<td><code>"12:34:56+00"</code></td>
</tr>

<tr>
<td><code>interval</code> </td>
<td><code>"1 year 2 mons 3 days"</code></td>
<td><code>"1 year 2 mons 3 days"</code></td>
</tr>

<tr>
<td><code>boolean</code> </td>
<td><code>true</code></td>
<td><code>true</code></td>
</tr>

<tr>
<td><code>uuid</code> </td>
<td><code>"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"</code></td>
<td><code>"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"</code></td>
</tr>

<tr>
<td><code>jsonb</code> </td>
<td><code>{"key":"value","num":42}</code></td>
<td><code>{"key":"value","num":42}</code></td>
</tr>

<tr>
<td><code>json</code> </td>
<td><code>{"arr":[1,2,3]}</code></td>
<td><code>{"arr":[1,2,3]}</code></td>
</tr>

<tr>
<td><code>inet</code> </td>
<td><code>"192.168.1.1"</code></td>
<td><code>"192.168.1.1"</code></td>
</tr>

<tr>
<td><code>cidr</code> </td>
<td><code>"192.168.1.0/24"</code></td>
<td><code>"192.168.1.0/24"</code></td>
</tr>

<tr>
<td><code>macaddr</code> </td>
<td><code>"08:00:2b:01:02:03"</code></td>
<td><code>"08:00:2b:01:02:03"</code></td>
</tr>

<tr>
<td><code>macaddr8</code> </td>
<td><code>"08:00:2b:01:02:03:04:05"</code></td>
<td><code>"08:00:2b:01:02:03:04:05"</code></td>
</tr>

<tr>
<td><code>tsvector</code> </td>
<td><code>"'a' 'cat' 'fat' 'mat' 'on' 'sat'"</code></td>
<td><code>"'a' 'cat' 'fat' 'mat' 'on' 'sat'"</code></td>
</tr>

<tr>
<td><code>tsquery</code> </td>
<td><code>"'fat' & 'cat'"</code></td>
<td><code>"'fat' & 'cat'"</code></td>
</tr>

<tr>
<td><code>xml</code> </td>
<td><code>"<root><item>test</item></root>"</code></td>
<td><code>"<root><item>test</item></root>"</code></td>
</tr>

<tr>
<td><code>point</code> </td>
<td><code>"(1,2)"</code></td>
<td><code>"(1,2)"</code></td>
</tr>

<tr>
<td><code>line</code> </td>
<td><code>"{1,2,3}"</code></td>
<td><code>"{1,2,3}"</code></td>
</tr>

<tr>
<td><code>lseg</code> </td>
<td><code>"[(1,2),(3,4)]"</code></td>
<td><code>"[(1,2),(3,4)]"</code></td>
</tr>

<tr>
<td><code>box</code> </td>
<td><code>"(3,4),(1,2)"</code></td>
<td><code>"(3,4),(1,2)"</code></td>
</tr>

<tr>
<td><code>path</code> </td>
<td><code>"[(1,2),(3,4),(5,6)]"</code></td>
<td><code>"[(1,2),(3,4),(5,6)]"</code></td>
</tr>

<tr>
<td><code>polygon</code> </td>
<td><code>"((1,2),(3,4),(5,6))"</code></td>
<td><code>"((1,2),(3,4),(5,6))"</code></td>
</tr>

<tr>
<td><code>circle</code> </td>
<td><code>"<(1,2),3>"</code></td>
<td><code>"<(1,2),3>"</code></td>
</tr>

<tr>
<td><code>pg_lsn</code> </td>
<td><code>"0/16A8F80"</code></td>
<td><code>"0/16A8F80"</code></td>
</tr>

<tr>
<td><code>pg_snapshot</code> </td>
<td><code>"100:200:"</code></td>
<td><code>"100:200:"</code></td>
</tr>

<tr>
<td><code>bit(3)</code> </td>
<td><code>"101"</code></td>
<td><code>"101"</code></td>
</tr>

<tr>
<td><code>varbit(16)</code> </td>
<td><code>"10011010"</code></td>
<td><code>"10011010"</code></td>
</tr>

<tr>
<td><code>char(5)</code> </td>
<td><code>"aaaaa"</code></td>
<td><code>"aaaaa"</code></td>
</tr>

<tr>
<td><code>varchar(255)</code> </td>
<td><code>"hello"</code></td>
<td><code>"hello"</code></td>
</tr>

<tr>
<td><code>decimal(10, 2)</code> </td>
<td><code>"12345.67"</code></td>
<td><code>"12345.67"</code></td>
</tr>

<tr>
<td><code>int4[]</code> </td>
<td><code>[1, 2, 3]</code></td>
<td><code>[1, 2, 3]</code></td>
</tr>

<tr>
<td><code>int8[]</code> </td>
<td><code>[1n, 2n, 3n]</code></td>
<td><code>[1n, 2n, 3n]</code></td>
</tr>

<tr>
<td><code>text[]</code> </td>
<td><code>["hello", "world"]</code></td>
<td><code>["hello", "world"]</code></td>
</tr>

<tr>
<td><code>float8[]</code> </td>
<td><code>[1.1, 2.2, 3.3]</code></td>
<td><code>[1.1, 2.2, 3.3]</code></td>
</tr>

<tr>
<td><code>boolean[]</code> </td>
<td><code>[true, false, true]</code></td>
<td><code>[true, false, true]</code></td>
</tr>

<tr>
<td><code>timestamp[]</code> </td>
<td><code>["2024-06-15 00:00:00", "2024-06-16 00:00:00"]</code></td>
<td><code>["2024-06-15 00:00:00", "2024-06-16 00:00:00"]</code></td>
</tr>

<tr>
<td><code>timestamptz[]</code> </td>
<td><code>[Date("2024-06-15T12:34:56.000Z"), Date("2024-06-16T12:34:56.000Z")]</code></td>
<td><code>[Date("2024-06-15T12:34:56.000Z"), Date("2024-06-16T12:34:56.000Z")]</code></td>
</tr>

<tr>
<td><code>decimal(10,2)[]</code> </td>
<td><code>["10.50", "20.75"]</code></td>
<td><code>["10.50", "20.75"]</code></td>
</tr>

<tr>
<td><code>point[]</code> </td>
<td><code>["(1,2)", "(3,4)"]</code></td>
<td><code>["(1,2)", "(3,4)"]</code></td>
</tr>

<tr>
<td><code>circle[]</code> </td>
<td><code>["<(1,2),3>", "<(4,5),6>"]</code></td>
<td><code>["<(1,2),3>", "<(4,5),6>"]</code></td>
</tr>

<tr>
<td><code>int4</code> (nullable)</td>
<td><code>null</code></td>
<td><code>null</code></td>
</tr>

<tr>
<td><code>text[]</code> (nullable)</td>
<td><code>[null, "hello", null]</code></td>
<td><code>[null, "hello", null]</code></td>
</tr>

<tr>
<td><code>text</code> (nullable)</td>
<td><code>undefined</code></td>
<td><code>null</code></td>
</tr>

<tr>
<td><code>text[]</code> (nullable)</td>
<td><code>[undefined, "hello", undefined]</code></td>
<td><code>[null, "hello", null]</code></td>
</tr>
</tbody>
</table>