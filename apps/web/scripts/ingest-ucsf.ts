import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { load } from 'cheerio';
import pg from 'pg';

const { Client } = pg;

export const ARCHIVE_URL = 'https://police.ucsf.edu/crime-log-archive';
export const DAILY_URL = 'https://police.ucsf.edu/daily-crime-logs';
const DEPARTMENT_ID = 'ucsf';
const UUID_NAMESPACE = '54b1687c-959a-5e9e-9951-18f4dbd29f02';
const EXPECTED_COLUMNS = [
	'case #',
	'reported',
	'nature',
	'location',
	'occurred',
	'disposition',
];

export interface SourcePage {
	title: string;
	url: string;
	priority: number;
}

export interface ScrapedRecord {
	caseNumber: string;
	reported: string;
	nature: string;
	location: string;
	occurred: string;
	disposition: string;
}

export interface FileRow {
	fileId: string;
	fileName: string;
	departmentId: string;
	sourceUrl: string;
}

export interface LocationRow {
	locationId: string;
	location: string;
	count: number;
	departmentId: string;
}

export interface RecordRow {
	recordId: string;
	caseNumber: string;
	incident: string;
	location: string | null;
	dateReported: string;
	dateOccurred: string | null;
	timeOccurred: null;
	summary: null;
	disposition: string | null;
	locationId: string | null;
	parsedDateReported: string | null;
	parsedDateOccurred: string | null;
	parsedTimeOccurred: string | null;
	departmentId: string;
	fileId: string;
}

export interface IngestDataset {
	generatedAt: string;
	archiveUrl: string;
	dailyUrl: string;
	sources: SourcePage[];
	files: FileRow[];
	locations: LocationRow[];
	records: RecordRow[];
	stats: {
		sourceRows: number;
		uniqueRecords: number;
		duplicateRows: number;
		uniqueLocations: number;
		distinctReportedDates: number;
		minimumReportedDate: string | null;
		maximumReportedDate: string | null;
		incompleteSourceRows: number;
	};
}

function cleanText(value: string): string {
	return value
		.replace(/\u00a0/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function uuidToBytes(uuid: string): Buffer {
	return Buffer.from(uuid.replaceAll('-', ''), 'hex');
}

function uuidV5(value: string, namespace = UUID_NAMESPACE): string {
	const hash = createHash('sha1')
		.update(uuidToBytes(namespace))
		.update(value)
		.digest();
	hash[6] = (hash[6]! & 0x0f) | 0x50;
	hash[8] = (hash[8]! & 0x3f) | 0x80;
	const hex = hash.subarray(0, 16).toString('hex');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function stableLocationId(location: string): string {
	const normalized = cleanText(location).toLocaleLowerCase('en-US');
	const slug = normalized
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 96);
	const suffix = createHash('sha256')
		.update(normalized)
		.digest('hex')
		.slice(0, 10);
	return `ucsf:${slug || 'unknown'}:${suffix}`;
}

function parseUsDate(value: string): string | null {
	const match = value.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/);
	if (!match) return null;
	const month = Number(match[1]);
	const day = Number(match[2]);
	let year = Number(match[3]);
	if (year < 100) year += year >= 70 ? 1900 : 2000;
	const date = new Date(Date.UTC(year, month - 1, day));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}
	return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function parseTime(value: string): string | null {
	const match = value.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
	if (!match) return null;
	return `${match[1]!.padStart(2, '0')}:${match[2]}:00`;
}

async function fetchHtml(url: string, attempts = 3): Promise<string> {
	let lastError: unknown;
	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		try {
			const response = await fetch(url, {
				headers: {
					'user-agent':
						'CallMap UCSF public crime-log importer/1.0 (+https://github.com/tetrahedronlabs/callmap)',
				},
				signal: AbortSignal.timeout(30_000),
			});
			if (!response.ok) {
				throw new Error(`${response.status} ${response.statusText}`);
			}
			return await response.text();
		} catch (error) {
			lastError = error;
			if (attempt < attempts) {
				await new Promise((resolveDelay) =>
					setTimeout(resolveDelay, attempt * 500)
				);
			}
		}
	}
	throw new Error(`Could not fetch ${url}: ${String(lastError)}`);
}

export function discoverArchiveSources(html: string): SourcePage[] {
	const $ = load(html);
	const sources = new Map<string, SourcePage>();
	$('.view-crime-log-archive .views-field-title a[href]').each((_, element) => {
		const href = $(element).attr('href');
		const title = cleanText($(element).text());
		if (!href || !/^\w+\s+20\d{2}$/.test(title)) return;
		const url = new URL(href, ARCHIVE_URL).toString();
		const parsed = Date.parse(`1 ${title} UTC`);
		sources.set(url, {
			title,
			url,
			priority: Number.isNaN(parsed) ? 0 : parsed,
		});
	});
	return [...sources.values()].sort(
		(left, right) => left.priority - right.priority
	);
}

export function parseCrimeLogPage(html: string, url: string): ScrapedRecord[] {
	const $ = load(html);
	for (const table of $('table').toArray()) {
		const headers = $(table)
			.find('thead th')
			.map((__, header) =>
				cleanText($(header).text()).toLocaleLowerCase('en-US')
			)
			.get();
		if (
			headers.length !== EXPECTED_COLUMNS.length ||
			!EXPECTED_COLUMNS.every((column, index) => headers[index] === column)
		) {
			continue;
		}
		const rows: ScrapedRecord[] = [];
		$(table)
			.find('tbody tr')
			.each((__, row) => {
				const cells = $(row)
					.find('td')
					.map((___, cell) => cleanText($(cell).text()))
					.get();
				if (cells.length === 0 || cells.every((cell) => cell === '')) return;
				if (cells.length !== EXPECTED_COLUMNS.length) {
					throw new Error(
						`Expected 6 cells but found ${cells.length} in ${url}`
					);
				}
				const [caseNumber, reported, nature, location, occurred, disposition] =
					cells;
				if (!caseNumber || !reported || !nature) {
					throw new Error(
						`Required crime-log value missing in ${url}: ${cells.join(' | ')}`
					);
				}
				rows.push({
					caseNumber,
					reported,
					nature,
					location,
					occurred,
					disposition,
				});
			});
		if (rows.length === 0) {
			throw new Error(`Crime-log table at ${url} contained no rows`);
		}
		return rows;
	}
	throw new Error(`No six-column UCSF crime-log table found at ${url}`);
}

function recordIdentity(record: ScrapedRecord): string {
	return [
		DEPARTMENT_ID,
		record.caseNumber,
		record.reported,
		record.nature,
		record.location,
		record.occurred,
	]
		.map((value) => cleanText(value).toLocaleLowerCase('en-US'))
		.join('\u001f');
}

export async function scrapeUcsfCrimeLogs(): Promise<IngestDataset> {
	const archiveHtml = await fetchHtml(ARCHIVE_URL);
	const archiveSources = discoverArchiveSources(archiveHtml);
	if (archiveSources.length === 0) {
		throw new Error(`No monthly archive pages discovered at ${ARCHIVE_URL}`);
	}
	const sources: SourcePage[] = [
		...archiveSources,
		{
			title: 'Current daily crime log',
			url: DAILY_URL,
			priority: Number.MAX_SAFE_INTEGER,
		},
	];

	const pages = await Promise.all(
		sources.map(async (source) => ({
			source,
			html: await fetchHtml(source.url),
		}))
	);
	const files = sources.map((source) => ({
		fileId: uuidV5(`file\u001f${source.url}`),
		fileName: source.url,
		departmentId: DEPARTMENT_ID,
		sourceUrl: source.url,
	}));
	const fileIdByUrl = new Map(
		files.map((file) => [file.sourceUrl, file.fileId])
	);
	const recordsByIdentity = new Map<
		string,
		{ row: RecordRow; priority: number }
	>();
	let sourceRows = 0;

	for (const { source, html } of pages.sort(
		(left, right) => left.source.priority - right.source.priority
	)) {
		const scraped = parseCrimeLogPage(html, source.url);
		const occurrenceByIdentity = new Map<string, number>();
		sourceRows += scraped.length;
		for (const item of scraped) {
			const baseIdentity = recordIdentity(item);
			const occurrence = (occurrenceByIdentity.get(baseIdentity) ?? 0) + 1;
			occurrenceByIdentity.set(baseIdentity, occurrence);
			const identity = `${baseIdentity}\u001e${occurrence}`;
			const parsedDateReported = parseUsDate(item.reported);
			const parsedDateOccurred = parseUsDate(item.occurred);
			const row: RecordRow = {
				recordId: uuidV5(`record\u001f${identity}`),
				caseNumber: item.caseNumber,
				incident: item.nature,
				location: item.location || null,
				dateReported: item.reported,
				dateOccurred: item.occurred || null,
				timeOccurred: null,
				summary: null,
				disposition: item.disposition || null,
				locationId: item.location ? stableLocationId(item.location) : null,
				parsedDateReported,
				parsedDateOccurred,
				parsedTimeOccurred: parseTime(item.occurred),
				departmentId: DEPARTMENT_ID,
				fileId: fileIdByUrl.get(source.url)!,
			};
			const previous = recordsByIdentity.get(identity);
			if (!previous || previous.priority <= source.priority) {
				recordsByIdentity.set(identity, { row, priority: source.priority });
			}
		}
	}

	const records = [...recordsByIdentity.values()]
		.map(({ row }) => row)
		.sort((left, right) =>
			`${left.parsedDateReported ?? ''}\u001f${left.recordId}`.localeCompare(
				`${right.parsedDateReported ?? ''}\u001f${right.recordId}`
			)
		);
	const locationsById = new Map<string, LocationRow>();
	for (const record of records) {
		if (!record.locationId || !record.location) continue;
		const previous = locationsById.get(record.locationId);
		locationsById.set(record.locationId, {
			locationId: record.locationId,
			location: record.location,
			count: (previous?.count ?? 0) + 1,
			departmentId: DEPARTMENT_ID,
		});
	}
	const locations = [...locationsById.values()].sort((left, right) =>
		left.locationId.localeCompare(right.locationId)
	);
	const reportedDates = [
		...new Set(
			records
				.map((record) => record.parsedDateReported)
				.filter((date): date is string => date !== null)
		),
	].sort();

	return {
		generatedAt: new Date().toISOString(),
		archiveUrl: ARCHIVE_URL,
		dailyUrl: DAILY_URL,
		sources,
		files,
		locations,
		records,
		stats: {
			sourceRows,
			uniqueRecords: records.length,
			duplicateRows: sourceRows - records.length,
			uniqueLocations: locations.length,
			distinctReportedDates: reportedDates.length,
			minimumReportedDate: reportedDates.at(0) ?? null,
			maximumReportedDate: reportedDates.at(-1) ?? null,
			incompleteSourceRows: records.filter(
				(record) =>
					!record.location || !record.dateOccurred || !record.disposition
			).length,
		},
	};
}

type SqlValue = string | number | null;

async function insertBatches(
	client: pg.Client,
	table: string,
	columns: string[],
	rows: SqlValue[][],
	conflictSql: string,
	batchSize = 100
): Promise<void> {
	for (let offset = 0; offset < rows.length; offset += batchSize) {
		const batch = rows.slice(offset, offset + batchSize);
		const values: SqlValue[] = [];
		const tuples = batch.map((row) => {
			const placeholders = row.map((value) => {
				values.push(value);
				return `$${values.length}`;
			});
			return `(${placeholders.join(', ')})`;
		});
		await client.query(
			`INSERT INTO ${table} (${columns.join(', ')}) VALUES ${tuples.join(', ')} ${conflictSql}`,
			values
		);
	}
}

export async function loadDataset(
	dataset: IngestDataset,
	connectionString: string
): Promise<{
	records: number;
	files: number;
	locations: number;
	days: number;
}> {
	const client = new Client({ connectionString });
	await client.connect();
	try {
		await client.query('BEGIN');
		const department = await client.query(
			'SELECT department_id FROM departments WHERE department_id = $1 FOR UPDATE',
			[DEPARTMENT_ID]
		);
		if (department.rowCount !== 1) {
			throw new Error(`Department ${DEPARTMENT_ID} does not exist`);
		}
		const [fileCollisions, locationCollisions, recordCollisions] =
			await Promise.all([
				client.query(
					'SELECT file_id FROM files WHERE file_id = ANY($1::uuid[]) AND department_id IS DISTINCT FROM $2 LIMIT 1',
					[dataset.files.map((file) => file.fileId), DEPARTMENT_ID]
				),
				client.query(
					'SELECT location_id FROM locations WHERE location_id = ANY($1::text[]) AND department_id IS DISTINCT FROM $2 LIMIT 1',
					[
						dataset.locations.map((location) => location.locationId),
						DEPARTMENT_ID,
					]
				),
				client.query(
					'SELECT record_id FROM records WHERE record_id = ANY($1::uuid[]) AND department_id IS DISTINCT FROM $2 LIMIT 1',
					[dataset.records.map((record) => record.recordId), DEPARTMENT_ID]
				),
			]);
		if (
			fileCollisions.rowCount ||
			locationCollisions.rowCount ||
			recordCollisions.rowCount
		) {
			throw new Error('Stable ID collision found outside the UCSF department');
		}
		await insertBatches(
			client,
			'files',
			['file_id', 'file_name', 'department_id'],
			dataset.files.map((file) => [
				file.fileId,
				file.fileName,
				file.departmentId,
			]),
			'ON CONFLICT (file_id) DO UPDATE SET file_name = EXCLUDED.file_name, department_id = EXCLUDED.department_id'
		);
		await insertBatches(
			client,
			'locations',
			[
				'location_id',
				'latitude',
				'longitude',
				'location',
				'count',
				'department_id',
			],
			dataset.locations.map((location) => [
				location.locationId,
				null,
				null,
				location.location,
				location.count,
				location.departmentId,
			]),
			'ON CONFLICT (location_id) DO UPDATE SET location = EXCLUDED.location, count = EXCLUDED.count, department_id = EXCLUDED.department_id'
		);
		await insertBatches(
			client,
			'records',
			[
				'record_id',
				'case_number',
				'incident',
				'location',
				'date_reported',
				'date_occurred',
				'time_occurred',
				'summary',
				'disposition',
				'location_id',
				'parsed_date_reported',
				'parsed_date_occurred',
				'parsed_time_occurred',
				'department_id',
				'file_id',
			],
			dataset.records.map((record) => [
				record.recordId,
				record.caseNumber,
				record.incident,
				record.location,
				record.dateReported,
				record.dateOccurred,
				record.timeOccurred,
				record.summary,
				record.disposition,
				record.locationId,
				record.parsedDateReported,
				record.parsedDateOccurred,
				record.parsedTimeOccurred,
				record.departmentId,
				record.fileId,
			]),
			`ON CONFLICT (record_id) DO UPDATE SET
				case_number = EXCLUDED.case_number,
				incident = EXCLUDED.incident,
				location = EXCLUDED.location,
				date_reported = EXCLUDED.date_reported,
				date_occurred = EXCLUDED.date_occurred,
				time_occurred = EXCLUDED.time_occurred,
				summary = EXCLUDED.summary,
				disposition = EXCLUDED.disposition,
				location_id = EXCLUDED.location_id,
				parsed_date_reported = EXCLUDED.parsed_date_reported,
				parsed_date_occurred = EXCLUDED.parsed_date_occurred,
				parsed_time_occurred = EXCLUDED.parsed_time_occurred,
				department_id = EXCLUDED.department_id,
				file_id = EXCLUDED.file_id`
		);
		const totals = await client.query<{
			records: string;
			files: string;
			locations: string;
			days: string;
		}>(
			`SELECT
				(SELECT count(*) FROM records WHERE department_id = $1)::text AS records,
				(SELECT count(*) FROM files WHERE department_id = $1)::text AS files,
				(SELECT count(*) FROM locations WHERE department_id = $1)::text AS locations,
				(SELECT count(DISTINCT parsed_date_reported) FROM records WHERE department_id = $1 AND parsed_date_reported IS NOT NULL)::text AS days`,
			[DEPARTMENT_ID]
		);
		const total = totals.rows[0]!;
		await client.query(
			`UPDATE departments
			 SET record_count = $2, days_parsed = $3, last_updated = NOW()
			 WHERE department_id = $1`,
			[DEPARTMENT_ID, Number(total.records), Number(total.days)]
		);
		await client.query('COMMIT');
		return {
			records: Number(total.records),
			files: Number(total.files),
			locations: Number(total.locations),
			days: Number(total.days),
		};
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		await client.end();
	}
}

interface CliOptions {
	load: boolean;
	output: string | null;
}

function parseCliOptions(argv: string[]): CliOptions {
	let loadToDatabase = false;
	let output: string | null = null;
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--load') {
			loadToDatabase = true;
		} else if (argument === '--output') {
			output = argv[index + 1] ?? null;
			if (!output) throw new Error('--output requires a path');
			index += 1;
		} else {
			throw new Error(`Unknown argument: ${argument}`);
		}
	}
	return { load: loadToDatabase, output };
}

async function main(): Promise<void> {
	const options = parseCliOptions(process.argv.slice(2));
	const dataset = await scrapeUcsfCrimeLogs();
	if (options.output) {
		const outputPath = resolve(options.output);
		await mkdir(dirname(outputPath), { recursive: true });
		await writeFile(
			outputPath,
			`${JSON.stringify(dataset, null, 2)}\n`,
			'utf8'
		);
	}
	const result: Record<string, unknown> = {
		status: 'scraped',
		...dataset.stats,
		sources: dataset.sources.length,
		output: options.output ? resolve(options.output) : null,
	};
	if (options.load) {
		const connectionString = process.env.DATABASE_URL;
		if (!connectionString) {
			throw new Error('DATABASE_URL is required with --load');
		}
		result.database = await loadDataset(dataset, connectionString);
		result.status = 'loaded';
	}
	process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const isMain = process.argv[1]
	? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
	: false;

if (isMain) {
	await main();
}
