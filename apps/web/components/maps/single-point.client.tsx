import 'mapbox-gl/dist/mapbox-gl.css';
import { Map, Marker, NavigationControl } from 'react-map-gl';
import type { SinglePointMapProps } from './single-point';

const maxBoundsDistance = 0.2;

export function SinglePointMapClient({
	latitude,
	longitude,
	zoom,
	accessToken,
}: SinglePointMapProps) {
	if (!accessToken) {
		return (
			<div className="flex h-full min-h-96 w-full items-center justify-center text-muted-foreground">
				Map unavailable: missing Mapbox access token.
			</div>
		);
	}

	return (
		<div className="h-full min-h-96 w-full">
			<Map
				mapStyle="mapbox://styles/mapbox/standard"
				mapboxAccessToken={accessToken}
				initialViewState={{ latitude, longitude, zoom }}
				maxBounds={[
					[longitude - maxBoundsDistance, latitude - maxBoundsDistance],
					[longitude + maxBoundsDistance, latitude + maxBoundsDistance],
				]}
			>
				<Marker latitude={latitude} longitude={longitude} color="red" />
				<NavigationControl />
			</Map>
		</div>
	);
}
