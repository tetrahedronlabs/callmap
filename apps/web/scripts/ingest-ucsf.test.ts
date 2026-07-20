import assert from 'node:assert/strict';
import test from 'node:test';

import { discoverArchiveSources, parseCrimeLogPage } from './ingest-ucsf.js';

test('discovers and chronologically sorts UCSF archive pages', () => {
	const sources = discoverArchiveSources(`
		<div class="view-crime-log-archive">
			<div class="views-field-title"><a href="/content/april-2026">April 2026</a></div>
			<div class="views-field-title"><a href="/content/march-2025">March 2025</a></div>
		</div>
	`);
	assert.deepEqual(
		sources.map((source) => source.title),
		['March 2025', 'April 2026']
	);
	assert.equal(sources[0]?.url, 'https://police.ucsf.edu/content/march-2025');
});

test('parses and normalizes the six-column crime log table', () => {
	const rows = parseCrimeLogPage(
		`<table>
			<thead><tr><th>Case #</th><th>Reported</th><th>Nature</th><th>Location</th><th>Occurred</th><th>Disposition</th></tr></thead>
			<tbody><tr><td> 2026-001 </td><td>07/15/2026 19:07</td><td>Theft&nbsp;from building</td><td>500 Parnassus Av</td><td>07/15/2026 17:00 - 18:17</td><td>Open/Active</td></tr></tbody>
		</table>`,
		'https://police.ucsf.edu/example'
	);
	assert.deepEqual(rows, [
		{
			caseNumber: '2026-001',
			reported: '07/15/2026 19:07',
			nature: 'Theft from building',
			location: '500 Parnassus Av',
			occurred: '07/15/2026 17:00 - 18:17',
			disposition: 'Open/Active',
		},
	]);
});

test('rejects a changed UCSF table shape instead of silently corrupting data', () => {
	assert.throws(
		() =>
			parseCrimeLogPage('<table><tr><td>unexpected</td></tr></table>', 'test'),
		/No six-column UCSF crime-log table/
	);
});

test('retains source rows whose optional location details are blank', () => {
	const rows = parseCrimeLogPage(
		`<table><thead><tr><th>Case #</th><th>Reported</th><th>Nature</th><th>Location</th><th>Occurred</th><th>Disposition</th></tr></thead>
		<tbody><tr><td>2025-001</td><td>05/06/2025 10:30</td><td>Burglary</td><td></td><td></td><td></td></tr></tbody></table>`,
		'test'
	);
	assert.equal(rows.length, 1);
	assert.equal(rows[0]?.location, '');
});
