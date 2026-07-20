import {
	bigint,
	date,
	doublePrecision,
	foreignKey,
	index,
	integer,
	pgTable,
	smallint,
	text,
	time,
	timestamp,
	unique,
	uuid,
} from 'drizzle-orm/pg-core';

export const departments = pgTable(
	'departments',
	{
		departmentId: smallint('department_id').primaryKey(),
		name: text('name').notNull(),
		recordCount: bigint('record_count', { mode: 'number' }).notNull(),
		lastUpdated: timestamp('last_updated', {
			withTimezone: true,
			mode: 'string',
		}).notNull(),
		daysParsed: bigint('days_parsed', { mode: 'number' }).notNull(),
		logo: text('logo').notNull(),
		slug: text('slug'),
	},
	(table) => [unique('departments_slug_key').on(table.slug)]
);

export const files = pgTable(
	'files',
	{
		fileId: uuid('file_id').primaryKey(),
		fileName: text('file_name'),
		departmentId: smallint('department_id'),
	},
	(table) => [
		foreignKey({
			name: 'files_department_id_fkey',
			columns: [table.departmentId],
			foreignColumns: [departments.departmentId],
		}),
		index('files_department_id_idx').on(table.departmentId),
	]
);

export const locations = pgTable(
	'locations',
	{
		parsedLocation: text('parsed_location').primaryKey(),
		latitude: doublePrecision('latitude'),
		longitude: doublePrecision('longitude'),
		location: text('location').notNull(),
		count: integer('count'),
		departmentId: smallint('department_id').notNull(),
	},
	(table) => [
		foreignKey({
			name: 'locations_department_id_fkey',
			columns: [table.departmentId],
			foreignColumns: [departments.departmentId],
		}),
		index('locations_department_id_idx').on(table.departmentId),
	]
);

export const records = pgTable(
	'records',
	{
		caseNumber: text('case_number'),
		incident: text('incident'),
		location: text('location'),
		recordId: uuid('record_id').primaryKey(),
		dateReported: text('date_reported'),
		dateOccurred: text('date_occurred'),
		timeOccurred: text('time_occurred'),
		summary: text('summary'),
		disposition: text('disposition'),
		parsedLocation: text('parsed_location'),
		parsedDateReported: date('parsed_date_reported', { mode: 'string' }),
		parsedDateOccurred: date('parsed_date_occurred', { mode: 'string' }),
		parsedTimeOccurred: time('parsed_time_occurred'),
		departmentId: smallint('department_id').notNull(),
		fileId: uuid('file_id'),
	},
	(table) => [
		foreignKey({
			name: 'records_department_id_fkey',
			columns: [table.departmentId],
			foreignColumns: [departments.departmentId],
		}),
		foreignKey({
			name: 'records_file_id_fkey',
			columns: [table.fileId],
			foreignColumns: [files.fileId],
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		index('records_department_id_idx').on(table.departmentId),
	]
);
