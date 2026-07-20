import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const localEnv = loadEnv(mode, process.cwd(), '');
	const mapboxAccessToken = localEnv.VITE_MAPBOX_ACCESS_TOKEN ?? '';

	return {
		plugins: [cloudflare({ viteEnvironment: { name: 'ssr' } }), reactRouter()],
		resolve: {
			tsconfigPaths: true,
		},
		define: {
			'import.meta.env.VITE_MAPBOX_ACCESS_TOKEN':
				JSON.stringify(mapboxAccessToken),
		},
	};
});
