import { useEffect, useState, type ComponentType } from 'react';
import { Skeleton } from '../ui/skeleton';

export interface SinglePointMapProps {
	latitude: number;
	longitude: number;
	zoom: number;
	accessToken: string;
}

export function SinglePointMap(props: SinglePointMapProps) {
	const [MapComponent, setMapComponent] =
		useState<ComponentType<SinglePointMapProps> | null>(null);

	useEffect(() => {
		let mounted = true;
		void import('./single-point.client').then(({ SinglePointMapClient }) => {
			if (mounted) {
				setMapComponent(() => SinglePointMapClient);
			}
		});
		return () => {
			mounted = false;
		};
	}, []);

	return MapComponent ? (
		<MapComponent {...props} />
	) : (
		<SinglePointMapSkeleton />
	);
}

export const SinglePointMapSkeleton = () => {
	return <Skeleton className="h-full w-full" />;
};
