# Default Madness

This document shows how different PostgreSQL clients handle date/time types **without** any unified mapping applied.
The purpose is to document the inconsistencies in default behavior across clients.

All tests run with `TZ=Europe/Helsinki`.

PG Library even advices *not* to use `timestamp`.

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
<td><code>Date("<span style="background: black; color: #4fc3f7">2024-01-01<span style="color: gray">T</span>00:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #4fc3f7">2024-01-01<span style="color: gray">T</span>00:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #ffb74d">2023-12-31<span style="color: gray">T</span>22:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #ffb74d">2023-12-31<span style="color: gray">T</span>22:00:00Z</span>")</code></td>
</tr>

<tr>
<td><code>timestamp</code></td>
<td><code>"2024-01-01 00:00"</code></td>
<td><code>Date("<span style="background: black; color: #ffb74d">2023-12-31<span style="color: gray">T</span>22:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #ffb74d">2023-12-31<span style="color: gray">T</span>22:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #81c784">2023-12-31<span style="color: gray">T</span>20:00:00Z</span>")</code></td>
</tr>

<tr>
<td><code>timestamptz</code></td>
<td><code>Date("<span style="background: black; color: #4fc3f7">2024-01-01<span style="color: gray">T</span>00:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #4fc3f7">2024-01-01<span style="color: gray">T</span>00:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #4fc3f7">2024-01-01<span style="color: gray">T</span>00:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #4fc3f7">2024-01-01<span style="color: gray">T</span>00:00:00Z</span>")</code></td>
</tr>

<tr>
<td><code>timestamptz</code></td>
<td><code>"2024-01-01 00:00:00"</code></td>
<td><code>Date("<span style="background: black; color: #4fc3f7">2024-01-01<span style="color: gray">T</span>00:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #ffb74d">2023-12-31<span style="color: gray">T</span>22:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #ffb74d">2023-12-31<span style="color: gray">T</span>22:00:00Z</span>")</code></td>
</tr>

<tr>
<td><code>date</code></td>
<td><code>Date("<span style="background: black; color: #4fc3f7">2024-01-01<span style="color: gray">T</span>00:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #ffb74d">2023-12-31<span style="color: gray">T</span>22:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #4fc3f7">2024-01-01<span style="color: gray">T</span>00:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #4fc3f7">2024-01-01<span style="color: gray">T</span>00:00:00Z</span>")</code></td>
</tr>

<tr>
<td><code>date</code></td>
<td><code>"2024-01-01"</code></td>
<td><code>Date("<span style="background: black; color: #ffb74d">2023-12-31<span style="color: gray">T</span>22:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #4fc3f7">2024-01-01<span style="color: gray">T</span>00:00:00Z</span>")</code></td>
<td><code>Date("<span style="background: black; color: #4fc3f7">2024-01-01<span style="color: gray">T</span>00:00:00Z</span>")</code></td>
</tr>
</tbody>
</table>