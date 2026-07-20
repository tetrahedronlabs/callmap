import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
	const date = new Date(dateString);
	const monthNames = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];
	const day = date.getDate();
	const monthIndex = date.getMonth();
	const remainder = day % 100;
	const suffix =
		remainder >= 11 && remainder <= 13
			? 'th'
			: (({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[day % 10] ??
				'th');

	return `${monthNames[monthIndex]} ${day}${suffix}`;
}

export function getDayOfWeek(date: string): string {
	const weekDays = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	];
	const dt = new Date(date);
	return weekDays[dt.getDay()];
}

export function getTimeSince(date: string): string {
	const msPerMinute = 60 * 1000;
	const msPerHour = msPerMinute * 60;
	const msPerDay = msPerHour * 24;

	const current = new Date();
	const previous = new Date(date);

	if (previous > current) {
		return 'Error, date is in the future';
	}

	const elapsed = current.getTime() - previous.getTime();

	if (elapsed < msPerHour) {
		return Math.round(elapsed / msPerMinute) + ' minutes ago';
	} else if (elapsed < msPerDay) {
		return Math.round(elapsed / msPerHour) + ' hours ago';
	} else {
		return Math.round(elapsed / msPerDay) + ' days ago';
	}
}
