import { Toaster } from '@/components/ui/sonner';
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from 'react-router';
import type { Route } from './+types/root';
import './globals.css';

export const meta: Route.MetaFunction = () => [
	{ title: 'CallMap' },
	{
		name: 'description',
		content: 'The open-source platform for campus safety data.',
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
				<script
					defer
					src="https://analytics.tetrahedron.dev/script.js"
					data-website-id="25fe5d84-b10b-4445-8d61-e048f30d4569"
				/>
			</head>
			<body>
				{children}
				<Toaster />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let title = 'Something went wrong';
	let message = 'An unexpected error occurred.';

	if (isRouteErrorResponse(error)) {
		title = error.status === 404 ? 'Not found' : `Error ${error.status}`;
		message = error.statusText || message;
	} else if (import.meta.env.DEV && error instanceof Error) {
		message = error.message;
	}

	return (
		<main className="mx-auto flex min-h-screen max-w-screen-xl flex-col items-center justify-center gap-2 px-4">
			<h1 className="text-3xl font-semibold">{title}</h1>
			<p className="text-muted-foreground">{message}</p>
		</main>
	);
}
