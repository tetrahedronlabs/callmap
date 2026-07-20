import { getDepartments, getSitemapRecords } from '@/app/lib/db.server';
import type { Route } from './+types/sitemap';

export async function loader({ request }: Route.LoaderArgs) {
	const origin = new URL(request.url).origin;
	const [departments, records] = await Promise.all([
		getDepartments(),
		getSitemapRecords(),
	]);
	const urls = [
		origin,
		...departments
			.filter((department) => department.slug)
			.map((department) => `${origin}/${department.slug}`),
		...records.map(
			(record) =>
				`${origin}/${record.department_slug}/records/${record.record_id}`
		),
	];
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
		.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
		.join('\n')}\n</urlset>\n`;

	return new Response(body, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
}

function escapeXml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}
