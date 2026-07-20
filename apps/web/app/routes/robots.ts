import type { Route } from './+types/robots';

export function loader({ request }: Route.LoaderArgs) {
	const origin = new URL(request.url).origin;
	return new Response(
		`User-agent: *\nAllow: /\n\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: ByteSpider\nDisallow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
	);
}
