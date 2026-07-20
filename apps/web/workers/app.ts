import { createRequestHandler } from 'react-router';

const requestHandler = createRequestHandler(
	() => import('virtual:react-router/server-build'),
	import.meta.env.MODE
);

export default {
	async fetch(request) {
		try {
			return await requestHandler(request);
		} catch (error) {
			console.error(
				JSON.stringify({
					message: 'Unhandled request error',
					path: new URL(request.url).pathname,
					error: error instanceof Error ? error.message : String(error),
				})
			);
			return new Response('Internal server error', { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
