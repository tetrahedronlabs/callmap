BEGIN;

ALTER TABLE public.records DROP CONSTRAINT records_location_id_fkey;
ALTER INDEX public.records_location_id_idx RENAME TO records_migrated_location_id_idx;
ALTER TABLE public.records RENAME COLUMN location_id TO parsed_location;
ALTER TABLE public.locations RENAME COLUMN location_id TO parsed_location;

ALTER TABLE public.files DROP CONSTRAINT files_department_id_fkey;
ALTER TABLE public.locations DROP CONSTRAINT locations_department_id_fkey;
ALTER TABLE public.records DROP CONSTRAINT records_department_id_fkey;

ALTER INDEX public.files_department_id_idx RENAME TO files_migrated_department_id_idx;
ALTER INDEX public.locations_department_id_idx RENAME TO locations_migrated_department_id_idx;
ALTER INDEX public.records_department_id_idx RENAME TO records_migrated_department_id_idx;

ALTER TABLE public.files RENAME COLUMN department_id TO migrated_department_id;
ALTER TABLE public.locations RENAME COLUMN department_id TO migrated_department_id;
ALTER TABLE public.records RENAME COLUMN department_id TO migrated_department_id;

ALTER TABLE public.files RENAME COLUMN legacy_department_id TO department_id;
ALTER TABLE public.locations RENAME COLUMN legacy_department_id TO department_id;
ALTER TABLE public.records RENAME COLUMN legacy_department_id TO department_id;

ALTER INDEX public.files_legacy_department_id_idx RENAME TO files_department_id_idx;
ALTER INDEX public.locations_legacy_department_id_idx RENAME TO locations_department_id_idx;
ALTER INDEX public.records_legacy_department_id_idx RENAME TO records_department_id_idx;

ALTER TABLE public.departments DROP CONSTRAINT departments_pkey;
ALTER TABLE public.departments DROP CONSTRAINT departments_legacy_department_id_key;
ALTER TABLE public.departments RENAME COLUMN department_id TO slug;
ALTER TABLE public.departments RENAME COLUMN legacy_department_id TO department_id;
ALTER TABLE public.departments ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);
ALTER TABLE public.departments ADD CONSTRAINT departments_slug_key UNIQUE (slug);

ALTER TABLE public.files ADD CONSTRAINT files_department_id_fkey
	FOREIGN KEY (department_id) REFERENCES public.departments(department_id);
ALTER TABLE public.locations ADD CONSTRAINT locations_department_id_fkey
	FOREIGN KEY (department_id) REFERENCES public.departments(department_id);
ALTER TABLE public.records ADD CONSTRAINT records_department_id_fkey
	FOREIGN KEY (department_id) REFERENCES public.departments(department_id);

COMMIT;
