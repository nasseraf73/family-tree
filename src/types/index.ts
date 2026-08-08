export type UserRole = 'USR' | 'REV' | 'ADM' | 'USER' | 'REVIEWER' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE';
export type RelationshipType = 'PARENT' | 'SPOUSE' | 'CHILD';
export type RelationshipStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type MergeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  password_hash?: string;
  role: UserRole;
  created_at: string;
}

export interface Country {
  id: number;
  name: string;
  code?: string;
  flag_emoji?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Person {
  id: number;
  first_name: string;
  father_name?: string;
  grand_father_name?: string;
  family_name?: string;
  gender: Gender;
  is_alive: boolean;
  birth_date?: string;
  birth_year?: number;
  death_date?: string;
  burial_place?: string;
  country_id?: number | null;
  photo_url?: string;
  biography?: string;
  is_placeholder?: boolean;
  created_by_user_id?: number;
  claimed_by_user_id?: number;
  claim_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface Relationship {
  id: number;
  person_id: number;
  related_person_id: number;
  relationship_type: RelationshipType;
  status: RelationshipStatus;
  created_by_user_id?: number;
  verified_by_user_id?: number;
  verified_at?: string;
  created_at: string;
}

export interface BranchReviewer {
  id: number;
  user_id: number;
  root_person_id: number;
  assigned_at: string;
}

export interface MergeRequest {
  id: number;
  primary_person_id: number;
  duplicate_person_id: number;
  status: MergeStatus;
  requested_by_user_id?: number;
  reviewed_by_user_id?: number;
  created_at: string;
}

export interface DeduplicationMatch {
  person: Person;
  score: number;
  nameSimilarity: number;
  contextSimilarity: number;
  birthYearProximity: number;
}
