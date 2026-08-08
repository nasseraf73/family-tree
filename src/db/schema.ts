import { pgTable, bigserial, varchar, text, integer, boolean, timestamp, bigint } from 'drizzle-orm/pg-core';

// 2.1 System Users Table (users)
export const users = pgTable('users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password_hash: text('password_hash'),
  full_name: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  role: varchar('role', { length: 20 }).default('USER').notNull(), // 'USER' | 'REVIEWER' | 'ADMIN'
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 2.0 Countries / Locations Table (countries)
export const countries = pgTable('countries', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 10 }),
  flag_emoji: varchar('flag_emoji', { length: 10 }),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 2.2 Individuals / Nodes Table (persons)
export const persons = pgTable('persons', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  first_name: varchar('first_name', { length: 100 }).notNull(),
  father_name: varchar('father_name', { length: 100 }),
  grand_father_name: varchar('grand_father_name', { length: 100 }),
  family_name: varchar('family_name', { length: 100 }),
  gender: varchar('gender', { length: 10 }).notNull(), // 'MALE' | 'FEMALE'
  is_alive: boolean('is_alive').default(true).notNull(),
  birth_year: integer('birth_year'),
  death_date: varchar('death_date', { length: 20 }),
  burial_place: varchar('burial_place', { length: 255 }),
  country_id: bigint('country_id', { mode: 'number' }).references(() => countries.id, { onDelete: 'set null' }),
  photo_url: text('photo_url'),
  biography: text('biography'),
  is_placeholder: boolean('is_placeholder').default(false),
  created_by_user_id: bigint('created_by_user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  claimed_by_user_id: bigint('claimed_by_user_id', { mode: 'number' }).unique().references(() => users.id, { onDelete: 'set null' }),
  claim_status: varchar('claim_status', { length: 20 }).default('PENDING'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 2.3 Direct Relationships Table (relationships)
export const relationships = pgTable('relationships', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  person_id: bigint('person_id', { mode: 'number' }).notNull().references(() => persons.id, { onDelete: 'cascade' }),
  related_person_id: bigint('related_person_id', { mode: 'number' }).notNull().references(() => persons.id, { onDelete: 'cascade' }),
  relationship_type: varchar('relationship_type', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).default('PENDING').notNull(),
  created_by_user_id: bigint('created_by_user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  verified_by_user_id: bigint('verified_by_user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  verified_at: timestamp('verified_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 2.4 Branch Reviewers Assignment Table (branch_reviewers)
export const branchReviewers = pgTable('branch_reviewers', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  user_id: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  root_person_id: bigint('root_person_id', { mode: 'number' }).notNull().references(() => persons.id, { onDelete: 'cascade' }),
  assigned_at: timestamp('assigned_at', { withTimezone: true }).defaultNow(),
});

// 2.5 Node Merge Requests Table (merge_requests)
export const mergeRequests = pgTable('merge_requests', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  primary_person_id: bigint('primary_person_id', { mode: 'number' }).notNull().references(() => persons.id, { onDelete: 'cascade' }),
  duplicate_person_id: bigint('duplicate_person_id', { mode: 'number' }).notNull().references(() => persons.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).default('PENDING').notNull(),
  requested_by_user_id: bigint('requested_by_user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  reviewed_by_user_id: bigint('reviewed_by_user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 2.6 Marriages & Spousal Relationships Table (marriages)
export const marriages = pgTable('marriages', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  husband_id: bigint('husband_id', { mode: 'number' }).notNull().references(() => persons.id, { onDelete: 'cascade' }),
  wife_id: bigint('wife_id', { mode: 'number' }).references(() => persons.id, { onDelete: 'cascade' }),
  external_spouse_name: varchar('external_spouse_name', { length: 255 }),
  external_family_name: varchar('external_family_name', { length: 255 }),
  status: varchar('status', { length: 50 }).default('ACTIVE').notNull(),
  marriage_order: integer('marriage_order').default(1).notNull(),
  created_by_user_id: bigint('created_by_user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
