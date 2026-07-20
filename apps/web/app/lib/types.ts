export interface Department {
	department_id: number;
	name: string;
	record_count: number;
	last_updated: string;
	days_parsed: number;
	logo: string;
	slug: string | null;
}

export interface DepartmentSummary extends Department {
	total_incidents: number;
	most_common_incident: string | null;
	most_common_location: string | null;
}

export interface RecordDetail {
	record_id: string;
	case_number: string | null;
	incident: string | null;
	location: string | null;
	date_reported: string | null;
	date_occurred: string | null;
	time_occurred: string | null;
	summary: string | null;
	disposition: string | null;
	parsed_location: string | null;
	department_id: number;
	department_name: string;
	latitude: number | null;
	longitude: number | null;
}

export interface SitemapRecord {
	department_slug: string;
	record_id: string;
}
