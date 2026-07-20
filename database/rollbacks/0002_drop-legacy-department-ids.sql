BEGIN;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM public.departments
		WHERE department_id NOT IN ('ucsd', 'ucsf', 'ucr')
	) THEN
		RAISE EXCEPTION 'cannot reconstruct unknown legacy department IDs';
	END IF;
END
$$;

ALTER TABLE public.departments ADD COLUMN legacy_department_id smallint;
UPDATE public.departments
SET legacy_department_id = CASE department_id
	WHEN 'ucsd' THEN 1
	WHEN 'ucsf' THEN 2
	WHEN 'ucr' THEN 3
END;
ALTER TABLE public.departments ALTER COLUMN legacy_department_id SET NOT NULL;
ALTER TABLE public.departments ADD CONSTRAINT departments_legacy_department_id_key
	UNIQUE (legacy_department_id);

ALTER TABLE public.files ADD COLUMN legacy_department_id smallint;
UPDATE public.files f
SET legacy_department_id = d.legacy_department_id
FROM public.departments d
WHERE f.department_id = d.department_id;
CREATE INDEX files_legacy_department_id_idx
	ON public.files USING btree (legacy_department_id);

ALTER TABLE public.locations ADD COLUMN legacy_department_id smallint;
UPDATE public.locations l
SET legacy_department_id = d.legacy_department_id
FROM public.departments d
WHERE l.department_id = d.department_id;
ALTER TABLE public.locations ALTER COLUMN legacy_department_id SET NOT NULL;
CREATE INDEX locations_legacy_department_id_idx
	ON public.locations USING btree (legacy_department_id);

ALTER TABLE public.records ADD COLUMN legacy_department_id smallint;
UPDATE public.records r
SET legacy_department_id = d.legacy_department_id
FROM public.departments d
WHERE r.department_id = d.department_id;
ALTER TABLE public.records ALTER COLUMN legacy_department_id SET NOT NULL;
CREATE INDEX records_legacy_department_id_idx
	ON public.records USING btree (legacy_department_id);

COMMIT;
