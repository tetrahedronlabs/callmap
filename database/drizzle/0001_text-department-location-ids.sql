BEGIN;
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM public.departments
		WHERE slug IS NULL OR btrim(slug) = ''
	) THEN
		RAISE EXCEPTION 'department slug cannot be used as department_id';
	END IF;

	IF EXISTS (
		SELECT slug
		FROM public.departments
		GROUP BY slug
		HAVING count(*) > 1
	) THEN
		RAISE EXCEPTION 'department slug values are not unique';
	END IF;
END
$$;
--> statement-breakpoint
INSERT INTO public.locations (
	parsed_location,
	latitude,
	longitude,
	location,
	count,
	department_id
)
SELECT
	r.parsed_location,
	NULL,
	NULL,
	COALESCE(min(r.location), r.parsed_location),
	count(*)::integer,
	r.department_id
FROM public.records r
LEFT JOIN public.locations l
	ON l.parsed_location = r.parsed_location
WHERE r.parsed_location IS NOT NULL
	AND l.parsed_location IS NULL
GROUP BY r.parsed_location, r.department_id;
--> statement-breakpoint
ALTER TABLE public.files DROP CONSTRAINT files_department_id_fkey;
--> statement-breakpoint
ALTER TABLE public.locations DROP CONSTRAINT locations_department_id_fkey;
--> statement-breakpoint
ALTER TABLE public.records DROP CONSTRAINT records_department_id_fkey;
--> statement-breakpoint
ALTER INDEX public.files_department_id_idx RENAME TO files_legacy_department_id_idx;
--> statement-breakpoint
ALTER INDEX public.locations_department_id_idx RENAME TO locations_legacy_department_id_idx;
--> statement-breakpoint
ALTER INDEX public.records_department_id_idx RENAME TO records_legacy_department_id_idx;
--> statement-breakpoint
ALTER TABLE public.files RENAME COLUMN department_id TO legacy_department_id;
--> statement-breakpoint
ALTER TABLE public.locations RENAME COLUMN department_id TO legacy_department_id;
--> statement-breakpoint
ALTER TABLE public.records RENAME COLUMN department_id TO legacy_department_id;
--> statement-breakpoint
ALTER TABLE public.files ADD COLUMN department_id text;
--> statement-breakpoint
ALTER TABLE public.locations ADD COLUMN department_id text;
--> statement-breakpoint
ALTER TABLE public.records ADD COLUMN department_id text;
--> statement-breakpoint
UPDATE public.files f
SET department_id = d.slug
FROM public.departments d
WHERE f.legacy_department_id = d.department_id;
--> statement-breakpoint
UPDATE public.locations l
SET department_id = d.slug
FROM public.departments d
WHERE l.legacy_department_id = d.department_id;
--> statement-breakpoint
UPDATE public.records r
SET department_id = d.slug
FROM public.departments d
WHERE r.legacy_department_id = d.department_id;
--> statement-breakpoint
ALTER TABLE public.locations ALTER COLUMN department_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE public.records ALTER COLUMN department_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE public.departments DROP CONSTRAINT departments_pkey;
--> statement-breakpoint
ALTER TABLE public.departments DROP CONSTRAINT departments_slug_key;
--> statement-breakpoint
ALTER TABLE public.departments RENAME COLUMN department_id TO legacy_department_id;
--> statement-breakpoint
ALTER TABLE public.departments RENAME COLUMN slug TO department_id;
--> statement-breakpoint
ALTER TABLE public.departments ALTER COLUMN department_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE public.departments ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);
--> statement-breakpoint
ALTER TABLE public.departments ADD CONSTRAINT departments_legacy_department_id_key UNIQUE (legacy_department_id);
--> statement-breakpoint
ALTER TABLE public.files ADD CONSTRAINT files_department_id_fkey
	FOREIGN KEY (department_id) REFERENCES public.departments(department_id);
--> statement-breakpoint
ALTER TABLE public.locations ADD CONSTRAINT locations_department_id_fkey
	FOREIGN KEY (department_id) REFERENCES public.departments(department_id);
--> statement-breakpoint
ALTER TABLE public.records ADD CONSTRAINT records_department_id_fkey
	FOREIGN KEY (department_id) REFERENCES public.departments(department_id);
--> statement-breakpoint
CREATE INDEX files_department_id_idx ON public.files USING btree (department_id);
--> statement-breakpoint
CREATE INDEX locations_department_id_idx ON public.locations USING btree (department_id);
--> statement-breakpoint
CREATE INDEX records_department_id_idx ON public.records USING btree (department_id);
--> statement-breakpoint
ALTER TABLE public.locations RENAME COLUMN parsed_location TO location_id;
--> statement-breakpoint
ALTER TABLE public.records RENAME COLUMN parsed_location TO location_id;
--> statement-breakpoint
ALTER TABLE public.records ADD CONSTRAINT records_location_id_fkey
	FOREIGN KEY (location_id) REFERENCES public.locations(location_id);
--> statement-breakpoint
CREATE INDEX records_location_id_idx ON public.records USING btree (location_id);
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM public.records r
		LEFT JOIN public.locations l ON l.location_id = r.location_id
		WHERE r.location_id IS NOT NULL AND l.location_id IS NULL
	) THEN
		RAISE EXCEPTION 'record location_id mapping is incomplete';
	END IF;
END
$$;
--> statement-breakpoint
COMMIT;
