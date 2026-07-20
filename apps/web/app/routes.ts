import {
	index,
	layout,
	route,
	type RouteConfig,
} from '@react-router/dev/routes';

export default [
	layout('routes/landing-layout.tsx', [index('routes/home.tsx')]),
	route(':departmentslug', 'routes/department.tsx'),
	route(':departmentslug/records/:recordid', 'routes/record.tsx'),
	route('sitemap.xml', 'routes/sitemap.ts'),
	route('robots.txt', 'routes/robots.ts'),
] satisfies RouteConfig;
