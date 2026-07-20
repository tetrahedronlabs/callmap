BEGIN;

CREATE TABLE public.departments (
	department_id smallint PRIMARY KEY,
	name text NOT NULL,
	record_count bigint NOT NULL,
	last_updated timestamp with time zone NOT NULL,
	days_parsed bigint NOT NULL,
	logo text NOT NULL,
	slug text UNIQUE
);

CREATE TABLE public.files (
	file_id uuid PRIMARY KEY,
	file_name text,
	department_id smallint REFERENCES public.departments(department_id)
);

CREATE TABLE public.locations (
	parsed_location text PRIMARY KEY,
	latitude double precision,
	longitude double precision,
	location text NOT NULL,
	count integer,
	department_id smallint NOT NULL REFERENCES public.departments(department_id)
);

CREATE TABLE public.records (
	case_number text,
	incident text,
	location text,
	record_id uuid PRIMARY KEY,
	date_reported text,
	date_occurred text,
	time_occurred text,
	summary text,
	disposition text,
	parsed_location text,
	parsed_date_reported date,
	parsed_date_occurred date,
	parsed_time_occurred time without time zone,
	department_id smallint NOT NULL REFERENCES public.departments(department_id),
	file_id uuid REFERENCES public.files(file_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX files_department_id_idx ON public.files(department_id);
CREATE INDEX locations_department_id_idx ON public.locations(department_id);
CREATE INDEX records_department_id_idx ON public.records(department_id);

COMMIT;
