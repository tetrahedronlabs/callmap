import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function DepartmentLogo({
	src,
	name,
	className,
}: {
	src: string;
	name: string;
	className?: string;
}) {
	const [hydrated, setHydrated] = useState(false);
	const [failed, setFailed] = useState(false);
	const initials = name
		.split(/\s+/)
		.map((word) => word[0])
		.join('')
		.slice(0, 3)
		.toUpperCase();

	useEffect(() => setHydrated(true), []);

	return (
		<div
			role="img"
			aria-label={`${name} logo`}
			className={cn(
				'relative flex items-center justify-center overflow-hidden rounded-md bg-muted text-sm font-semibold text-muted-foreground',
				className
			)}
		>
			<span aria-hidden="true">{initials}</span>
			{hydrated && !failed ? (
				<img
					src={src}
					alt=""
					className="absolute inset-0 h-full w-full bg-background object-contain"
					draggable={false}
					onError={() => setFailed(true)}
				/>
			) : null}
		</div>
	);
}
