import { getDepartment } from '@/app/lib/db.server';
import { DepartmentLogo } from '@/components/department-logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, getDayOfWeek, getTimeSince } from '@/lib/utils';
import {
	BarChartBigIcon,
	CalculatorIcon,
	FileUpIcon,
	MapPinIcon,
} from 'lucide-react';
import type { Route } from './+types/department';

export async function loader({ params }: Route.LoaderArgs) {
	const department = await getDepartment(params.departmentid);
	if (!department) {
		throw new Response('Campus not found', { status: 404 });
	}
	return { department };
}

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{
			title: loaderData ? `${loaderData.department.name} | CallMap` : 'CallMap',
		},
	];
}

export default function Department({ loaderData }: Route.ComponentProps) {
	const { department } = loaderData;
	return (
		<main className="mx-auto max-w-screen-xl px-2 py-4">
			<Tabs defaultValue="latest">
				<Card className="flex flex-col items-center justify-between p-4 lg:flex-row">
					<div className="flex items-center gap-3">
						<DepartmentLogo
							src={department.logo}
							name={department.name}
							className="h-20 w-20 object-contain"
						/>
						<div className="text-4xl font-medium text-slate-900">
							{department.name}
						</div>
					</div>
					<TabsList>
						<TabsTrigger value="latest">Latest</TabsTrigger>
						<TabsTrigger value="historical">Historical</TabsTrigger>
					</TabsList>
				</Card>
				<TabsContent value="latest">
					<div className="grid gap-2 lg:grid-cols-4">
						<MetricCard
							title="Data From"
							value={`${getDayOfWeek(department.last_updated)}, ${formatDate(department.last_updated)}`}
							detail={`Updated ${getTimeSince(department.last_updated)}`}
							icon={<FileUpIcon />}
						/>
						<MetricCard
							title="Total Incidents"
							value={department.total_incidents.toLocaleString()}
							detail={`${department.days_parsed.toLocaleString()} days indexed`}
							icon={<CalculatorIcon />}
						/>
						<MetricCard
							title="Most Common Incident"
							value={department.most_common_incident ?? 'Unavailable'}
							detail="Across indexed records"
							icon={<BarChartBigIcon />}
						/>
						<MetricCard
							title="Most Common Location"
							value={department.most_common_location ?? 'Unavailable'}
							detail="Across indexed records"
							icon={<MapPinIcon />}
						/>
					</div>
				</TabsContent>
				<TabsContent value="historical">
					<Card className="p-6 text-muted-foreground">
						Historical charts are coming soon.
					</Card>
				</TabsContent>
			</Tabs>
		</main>
	);
}

function MetricCard({
	title,
	value,
	detail,
	icon,
}: {
	title: string;
	value: string;
	detail: string;
	icon: React.ReactNode;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				{icon}
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				<p className="text-xs text-muted-foreground">{detail}</p>
			</CardContent>
		</Card>
	);
}
