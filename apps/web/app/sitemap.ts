import { getDepartments } from '@/lib/department';
import { getLocations } from '@/lib/location';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseurl = 'https://callmap.app';

	const getDepartment = await getDepartments();
	const getLocation = await getLocations();

	const departments = getDepartment?.map((department) => {
		return {
			url: `${baseurl}/${department?.slug}`,
			lastModified: new Date(),
		};
	});

	const locations = getLocation?.map((location) => {
		return {
			url: `${baseurl}/${location?.department_id}/${location?.parsed_location}`,
			lastModified: new Date(),
		};
	});

	return [
		{
			url: `${baseurl}/`,
			lastModified: new Date(),
		},
		{
			url: `${baseurl}/blog`,
			lastModified: new Date(),
		},
		...(departments as { url: string; lastModified: Date }[]),
		...(locations as { url: string; lastModified: Date }[]),
	];
}
