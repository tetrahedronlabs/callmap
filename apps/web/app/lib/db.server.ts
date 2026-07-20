import { env } from 'cloudflare:workers';
import { Client, type QueryResultRow } from 'pg';
import type {
	Department,
	DepartmentSummary,
	RecordDetail,
	SitemapRecord,
} from './types';

async function queryRows<Row extends QueryResultRow>(
	text: string,
	values: readonly unknown[] = []
): Promise<Row[]> {
	const client = new Client({
		connectionString: env.HYPERDRIVE.connectionString,
	});
	let connected = false;

	try {
		await client.connect();
		connected = true;
		const result = await client.query<Row>(text, [...values]);
		return result.rows;
	} finally {
		if (connected) {
			await client.end();
		}
	}
}

export async function getDepartments(): Promise<Department[]> {
	return queryRows<Department>(`
		SELECT
			d.department_id,
			d.name,
			count(r.record_id)::integer AS record_count,
			d.last_updated::text AS last_updated,
			d.days_parsed::integer AS days_parsed,
			d.logo,
			d.slug
		FROM public.departments d
		LEFT JOIN public.records r ON r.department_id = d.department_id
		GROUP BY d.department_id
		ORDER BY d.name
	`);
}

export async function getDepartment(
	slug: string
): Promise<DepartmentSummary | null> {
	const rows = await queryRows<DepartmentSummary>(
		`
			SELECT
				d.department_id,
				d.name,
				d.record_count::integer AS record_count,
				d.last_updated::text AS last_updated,
				COALESCE(
					(
						SELECT count(DISTINCT r.parsed_date_reported)
						FROM public.records r
						WHERE r.department_id = d.department_id
							AND r.parsed_date_reported IS NOT NULL
					),
					0
				)::integer AS days_parsed,
				d.logo,
				d.slug,
				(
					SELECT count(*)::integer
					FROM public.records r
					WHERE r.department_id = d.department_id
				) AS total_incidents,
				(
					SELECT r.incident
					FROM public.records r
					WHERE r.department_id = d.department_id AND r.incident IS NOT NULL
					GROUP BY r.incident
					ORDER BY count(*) DESC, r.incident
					LIMIT 1
				) AS most_common_incident,
				(
					SELECT r.location
					FROM public.records r
					WHERE r.department_id = d.department_id AND r.location IS NOT NULL
					GROUP BY r.location
					ORDER BY count(*) DESC, r.location
					LIMIT 1
				) AS most_common_location
			FROM public.departments d
			WHERE d.slug = $1
			LIMIT 1
		`,
		[slug]
	);
	return rows[0] ?? null;
}

export async function getRecord(
	departmentSlug: string,
	recordId: string
): Promise<RecordDetail | null> {
	const rows = await queryRows<RecordDetail>(
		`
			SELECT
				r.record_id::text AS record_id,
				r.case_number,
				r.incident,
				r.location,
				r.date_reported,
				r.date_occurred,
				r.time_occurred,
				r.summary,
				r.disposition,
				r.parsed_location,
				r.department_id,
				d.name AS department_name,
				l.latitude,
				l.longitude
			FROM public.records r
			JOIN public.departments d ON d.department_id = r.department_id
			LEFT JOIN public.locations l
				ON l.department_id = r.department_id
				AND l.parsed_location = r.parsed_location
			WHERE d.slug = $1 AND r.record_id::text = $2
			LIMIT 1
		`,
		[departmentSlug, recordId]
	);
	return rows[0] ?? null;
}

export async function getSitemapRecords(): Promise<SitemapRecord[]> {
	return queryRows<SitemapRecord>(`
		SELECT d.slug AS department_slug, r.record_id::text AS record_id
		FROM public.records r
		JOIN public.departments d ON d.department_id = r.department_id
		WHERE d.slug IS NOT NULL
		ORDER BY d.slug, r.record_id
	`);
}
