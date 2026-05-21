import { writeFileSync } from "node:fs";
import { describe, it } from "vitest";
import { PGUNIFIED_TYPE_MAPPING } from "../src/types.ts";
import { getTestTable } from "./test-table.ts";

/**
 * Converts multiline markdown template string into a properly formatted markdown string, by:
 * - Removing leading indentation (based on the first non-empty line)
 * - Trimming leading and trailing empty lines
 */
function md(strings: TemplateStringsArray, ...values: any[]) {
  // Combine strings and values into a single string
  const raw = strings.reduce(
    (acc, str, i) => acc + str + (i < values.length ? String(values[i]) : ""),
    "",
  );

  // Split into lines
  const lines = raw.split("\n");

  // Find indentation of the first non-empty line (this is the template content indent)
  const baseIndent =
    lines.reduce(
      (found, line) => {
        if (found !== undefined) return found;
        if (line.trim().length === 0) return undefined;
        const match = line.match(/^(\s*)/);
        return match?.[1]?.length ?? 0;
      },
      undefined as number | undefined,
    ) ?? 0;

  // Strip at most baseIndent spaces from each line, then trim leading/trailing empty lines
  const stripped = lines
    .map((line) => {
      const match = line.match(/^(\s*)/);
      const indent = match?.[1]?.length ?? 0;
      const strip = Math.min(baseIndent, indent);
      return line.slice(strip);
    })
    .join("\n")
    .trim();

  return stripped;
}

function formatValue(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "bigint") return `${value}n`;
  if (value instanceof Date) return `Date("${value.toISOString()}")`;
  if (value instanceof Uint8Array)
    return `Uint8Array([${Array.from(value).join(", ")}])`;
  if (Array.isArray(value)) return `[${value.map(formatValue).join(", ")}]`;
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

function makeTestCaseTableHtml() {
  const table = getTestTable();

  const rows = Object.entries(table)
    .map(([name, { type, input, output }]) => {
      const out = output !== undefined ? output : input;
      return `
      <tr>
        <td><code>${type}</code></td>
        <td><code>${formatValue(input)}</code></td>
        <td><code>${formatValue(out)}</code></td>
      </tr>`;
    })
    .join("\n");

  return `<table>
    <thead>
      <tr>
          <th>Postgres Type</th>
          <th>Input (INSERT or UPDATE input)</th>
          <th>Output (SELECT output)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`;
}

function formatTypeLiteral(type: unknown): string {
  if (typeof type === "string") return type;
  if (Array.isArray(type)) {
    if (type[0] === "array") {
      return `${formatTypeLiteral(type[1])}[]`;
    }
    return type.map(formatTypeLiteral).join(" | ");
  }
  return String(type);
}

function makeTypeInfoTableHtml() {
  const mapping = PGUNIFIED_TYPE_MAPPING;

  const rows = Object.entries(mapping)
    .map(([pgType, fn]) => {
      // Call the mapping function with appropriate dummy args based on arity
      const arity = fn.length;
      const args = Array(arity).fill(0) as number[];
      const { input, output } = (fn as (...a: number[]) => any)(...args);
      return `
      <tr>
        <td><code>${pgType}</code></td>
        <td><code>${formatTypeLiteral(input)}</code></td>
        <td><code>${formatTypeLiteral(output)}</code></td>
      </tr>`;
    })
    .join("\n");

  return `<table>
    <thead>
      <tr>
          <th>Postgres Type</th>
          <th>Input type (INSERT or UPDATE input)</th>
          <th>Output type (SELECT output)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`;
}

const skipLabelMap: Record<string, string> = {
  skipPorsager: "npm:postgres",
  skipPgLite: "npm:@electric-sql/pglite",
  skipPg: "npm:pg",
  skipPostgreJS: "npm:postgrejs",
};

function makeQuirksHtml() {
  const table = getTestTable();

  const items = Object.entries(table)
    .flatMap(([_name, { type, input, ...skips }]) => {
      return Object.entries(skips)
        .filter(([key]) => key in skipLabelMap)
        .map(([key, reason]) => ({
          type,
          input: formatValue(input),
          reason: typeof reason === "string" ? reason : "unspecified",
          driver: skipLabelMap[key],
        }));
    })
    .map(
      ({ type, input, reason, driver }) =>
        `* ${driver} &mdash; type <code>${type}</code> fails with input <code>${input}</code> ${reason}`,
    )
    .toSorted()
    .join("\n");

  return `\n${items}\n`;
}

describe("generate README.md doc", () => {
  it("generates README.md with HTML table of all test types", () => {
    const testCaseTableHtml = makeTestCaseTableHtml();
    const typeInfoTableHtml = makeTypeInfoTableHtml();
    const quirksHtml = makeQuirksHtml();
    writeFileSync(
      "README.md",
      md`
        # pg-unified-mapping

        This library provides a unified type mapping for PostgreSQL types across different JavaScript PostgreSQL clients:

        Currently supported clients:

        - [npm:pg](https://www.npmjs.com/package/pg)
        - [npm:postgres](https://www.npmjs.com/package/postgres)
        - [npm:@electric-sql/pglite](https://www.npmjs.com/package/@electric-sql/pglite)

        ## Recommendation

        Use to \`pg\` and \`pglite\`, mapping is easiest with those and has least quirks.

        ## Usage

        Open [src/mapper.ts](src/mapper.ts) to see the full mapping implementation, and copy the relevant function to your project.

        ### npm:pg

        \`\`\`typescript
        import pg from "pg";
        
        const client = await new pg.Client({
          host: "localhost", 
          types: createPgMapperTypes(pg), // Copy this function to your project
        });
        \`\`\`

        ### npm:@electric-sql/pglite

        \`\`\`typescript
        import { PGlite } from "@electric-sql/pglite";

        new PGlite({
          parsers: createPgliteParsers(), // Copy this function to your project
        });
        \`\`\`
        
        ### npm:postgres

        \`\`\`typescript
        import postgres from "postgres";

        postgres({
          host: "localhost",
          types: createPorasgerTypes(), // Copy this function to your project
        });
        \`\`\`

        postgres parser has difficulty with arrays, I've made a monkey patch \`monkeyPatchArrayInference\` but it would best if it was fixed in the library itself, see [the bug](https://github.com/porsager/postgres/issues/471).

        ## Known quirks

        ${quirksHtml}
        
        ## Type mapping

        ${typeInfoTableHtml}

        ## Test cases

        ${testCaseTableHtml}
      `,
    );
  });
});
