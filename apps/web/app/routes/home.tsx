import { getDepartments } from '@/app/lib/db.server';
import { DepartmentLogo } from '@/components/department-logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router';
import type { Route } from './+types/home';

export const meta: Route.MetaFunction = () => [
	{ title: 'CallMap' },
	{
		name: 'description',
		content: 'Explore open campus safety records by department.',
	},
];

export async function loader() {
	return { departments: await getDepartments() };
}

export default function Home({ loaderData }: Route.ComponentProps) {
	return (
		<main className="mx-auto min-h-[calc(100vh-8rem)] max-w-screen-xl px-4 pb-12 pt-24">
			<div className="max-w-2xl">
				<h1 className="text-4xl font-semibold tracking-tight">
					Campus safety data, made easier to explore.
				</h1>
				<p className="mt-3 text-lg text-muted-foreground">
					Browse public incident records collected from campus safety
					departments.
				</p>
			</div>
			<div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{loaderData.departments
					.filter((department) => department.slug !== null)
					.map((department) => (
						<Link key={department.department_id} to={`/${department.slug}`}>
							<Card className="h-full transition-colors hover:bg-muted/40">
								<CardHeader className="flex flex-row items-center gap-4">
									<DepartmentLogo
										src={department.logo}
										name={department.name}
										className="h-14 w-14 object-contain"
									/>
									<CardTitle>{department.name}</CardTitle>
								</CardHeader>
								<CardContent className="text-sm text-muted-foreground">
									{department.record_count.toLocaleString()} records
								</CardContent>
							</Card>
						</Link>
					))}
			</div>
		</main>
	);
}
