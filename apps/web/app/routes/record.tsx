import { getRecord } from '@/app/lib/db.server';
import { SinglePointMap } from '@/components/maps/single-point';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Route } from './+types/record';

export async function loader({ params }: Route.LoaderArgs) {
	const record = await getRecord(params.departmentid, params.recordid);
	if (!record) {
		throw new Response('Record not found', { status: 404 });
	}
	return { record };
}

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{
			title: loaderData
				? `${loaderData.record.case_number ?? 'Incident record'} | CallMap`
				: 'Record | CallMap',
		},
	];
}

export default function Record({ loaderData }: Route.ComponentProps) {
	const { record } = loaderData;
	return (
		<main className="mx-auto flex min-h-screen max-w-screen-xl items-center justify-center px-2">
			<div className="mt-16 flex w-full flex-col sm:flex-row sm:space-x-2">
				<div className="max-sm:pb-1 sm:w-1/2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between gap-2">
								Record Details <Badge>{record.department_name}</Badge>
							</CardTitle>
						</CardHeader>
						<CardContent className="mt-2 space-y-2">
							<RecordLine label="Case Number" value={record.case_number} />
							<RecordLine label="Incident Type" value={record.incident} />
							<RecordLine label="Location" value={record.location} />
							<RecordLine label="Date Reported" value={record.date_reported} />
							<RecordLine
								label="Date/Time Occurred"
								value={[record.date_occurred, record.time_occurred]
									.filter(Boolean)
									.join(' ')}
							/>
							<RecordLine label="Summary" value={record.summary} />
							<RecordLine label="Disposition" value={record.disposition} />
						</CardContent>
					</Card>
				</div>
				{record.longitude !== null && record.latitude !== null ? (
					<Card className="min-h-96 grow overflow-hidden">
						<SinglePointMap
							latitude={record.latitude}
							longitude={record.longitude}
							zoom={15.5}
							accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? ''}
						/>
					</Card>
				) : (
					<Card className="flex min-h-48 flex-grow items-center justify-center">
						<p className="text-lg font-semibold">
							No coordinate data available.
						</p>
					</Card>
				)}
			</div>
		</main>
	);
}

function RecordLine({ label, value }: { label: string; value: string | null }) {
	return (
		<div className="flex flex-col justify-center">
			<h2 className="font-semibold">{label}</h2>
			<p className="font-mono">{value || 'Unavailable'}</p>
		</div>
	);
}
