# Default Madness

This document shows how different PostgreSQL clients handle date/time types **without** any unified mapping applied.
The purpose is to document the inconsistencies in default behavior across clients.

All tests run with `TZ=Europe/Helsinki`.

PG Library even advices *not* to use `timestamp` because it changes the dates each time if you take the value it outputs and store it back!

<table>
<thead>
<tr>
<th>Postgres Type</th>
<th>Input</th>
<th>npm:pg output</th>
<th>npm:@electric-sql/pglite output</th>
<th>npm:postgres output</th>
</tr>
</thead>
<tbody>

<tr>
<td><code>timestamp</code></td>
<td><code>Date("2024-01-01T00:00:00.000Z")</code></td>
<td><code>Date("2024-01-01T00:00:00.000Z")</code></td>
<td><code>Date("2023-12-31T22:00:00.000Z")</code></td>
<td><code>Date("2023-12-31T22:00:00.000Z")</code></td>
</tr>

<tr>
<td><code>timestamp</code></td>
<td><code>"2024-01-01 00:00"</code></td>
<td><code>Date("2023-12-31T22:00:00.000Z")</code></td>
<td><code>Date("2023-12-31T22:00:00.000Z")</code></td>
<td><code>Date("2023-12-31T20:00:00.000Z")</code></td>
</tr>

<tr>
<td><code>timestamptz</code></td>
<td><code>Date("2024-01-01T00:00:00.000Z")</code></td>
<td><code>Date("2024-01-01T00:00:00.000Z")</code></td>
<td><code>Date("2024-01-01T00:00:00.000Z")</code></td>
<td><code>Date("2024-01-01T00:00:00.000Z")</code></td>
</tr>

<tr>
<td><code>timestamptz</code></td>
<td><code>"2024-01-01 00:00:00"</code></td>
<td><code>Date("2024-01-01T00:00:00.000Z")</code></td>
<td><code>Date("2023-12-31T22:00:00.000Z")</code></td>
<td><code>Date("2023-12-31T22:00:00.000Z")</code></td>
</tr>

<tr>
<td><code>date</code></td>
<td><code>Date("2024-01-01T00:00:00.000Z")</code></td>
<td><code>Date("2023-12-31T22:00:00.000Z")</code></td>
<td><code>Date("2024-01-01T00:00:00.000Z")</code></td>
<td><code>Date("2024-01-01T00:00:00.000Z")</code></td>
</tr>

<tr>
<td><code>date</code></td>
<td><code>"2024-01-01"</code></td>
<td><code>Date("2023-12-31T22:00:00.000Z")</code></td>
<td><code>Date("2024-01-01T00:00:00.000Z")</code></td>
<td><code>Date("2024-01-01T00:00:00.000Z")</code></td>
</tr>
</tbody>
</table>