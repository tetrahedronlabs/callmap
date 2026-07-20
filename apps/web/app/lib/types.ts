export interface Department {
	department_id: string;
	name: string;
	record_count: number;
	last_updated: string;
	days_parsed: number;
	logo: string;
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
	location_id: string | null;
	department_id: string;
	department_name: string;
	latitude: number | null;
	longitude: number | null;
}

export interface SitemapRecord {
	department_id: string;
	record_id: string;
}
