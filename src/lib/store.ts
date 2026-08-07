import { Person, Relationship, User, BranchReviewer, MergeRequest, Country } from '@/types';

// Empty Store for Production Application (No mock/default seed data)
const INITIAL_USERS: User[] = [];
const INITIAL_PERSONS: Person[] = [];
const INITIAL_RELATIONSHIPS: Relationship[] = [];
const INITIAL_BRANCH_REVIEWERS: BranchReviewer[] = [];
const INITIAL_MERGE_REQUESTS: MergeRequest[] = [];
const INITIAL_COUNTRIES: Country[] = [];

export class MemoryStore {
  private users: User[] = [...INITIAL_USERS];
  private persons: Person[] = [...INITIAL_PERSONS];
  private relationships: Relationship[] = [...INITIAL_RELATIONSHIPS];
  private branchReviewers: BranchReviewer[] = [...INITIAL_BRANCH_REVIEWERS];
  private mergeRequests: MergeRequest[] = [...INITIAL_MERGE_REQUESTS];
  private countries: Country[] = [...INITIAL_COUNTRIES];

  public currentUser: User | null = null;

  getUsers(): User[] {
    return this.users;
  }

  getPersons(): Person[] {
    return this.persons;
  }

  getPersonById(id: number): Person | undefined {
    return this.persons.find(p => p.id === id);
  }

  deletePerson(id: number): void {
    this.persons = this.persons.filter(p => p.id !== id);
  }

  getRelationships(): Relationship[] {
    return this.relationships;
  }

  getBranchReviewers(): BranchReviewer[] {
    return this.branchReviewers;
  }

  getMergeRequests(): MergeRequest[] {
    return this.mergeRequests;
  }

  setCurrentUser(user: User) {
    this.currentUser = user;
  }

  addPerson(person: Omit<Person, 'id' | 'created_at'>): Person {
    const newPerson: Person = {
      ...person,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    this.persons.push(newPerson);
    return newPerson;
  }

  addRelationship(rel: Omit<Relationship, 'id' | 'created_at'>): Relationship {
    const newRel: Relationship = {
      ...rel,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    this.relationships.push(newRel);
    return newRel;
  }

  approveRelationship(relId: number, reviewerUserId: number) {
    const rel = this.relationships.find(r => r.id === relId);
    if (rel) {
      rel.status = 'VERIFIED';
      rel.verified_by_user_id = reviewerUserId;
      rel.verified_at = new Date().toISOString();
    }
  }

  rejectRelationship(relId: number) {
    const rel = this.relationships.find(r => r.id === relId);
    if (rel) {
      rel.status = 'REJECTED';
    }
  }

  approveMerge(requestId: number, reviewerUserId: number) {
    const req = this.mergeRequests.find(m => m.id === requestId);
    if (req) {
      req.status = 'APPROVED';
      req.reviewed_by_user_id = reviewerUserId;

      this.relationships.forEach(rel => {
        if (rel.person_id === req.duplicate_person_id) {
          rel.person_id = req.primary_person_id;
        }
        if (rel.related_person_id === req.duplicate_person_id) {
          rel.related_person_id = req.primary_person_id;
        }
      });

      this.persons = this.persons.filter(p => p.id !== req.duplicate_person_id);
    }
  }

  claimProfile(personId: number, userId: number): { success: boolean; message: string } {
    const person = this.persons.find(p => p.id === personId);
    if (!person) return { success: false, message: 'الشخص غير موجود' };
    if (person.claimed_by_user_id) {
      return { success: false, message: 'الملف الشخصي تم المطالبة به بالفعل من قبل عضو آخر.' };
    }

    person.claimed_by_user_id = userId;
    return { success: true, message: 'تم إرسال طلب المطالبة بالملف بنجاح إلى مشرف الفرع للمراجعة.' };
  }

  getCountries(): Country[] {
    return this.countries;
  }

  addCountry(c: Omit<Country, 'id' | 'created_at'>): Country {
    const newCountry: Country = {
      ...c,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    this.countries.push(newCountry);
    return newCountry;
  }

  updateCountry(id: number, updates: Partial<Omit<Country, 'id'>>): Country | null {
    const country = this.countries.find(c => c.id === id);
    if (!country) return null;
    Object.assign(country, updates);
    return country;
  }

  deleteCountry(id: number): boolean {
    const index = this.countries.findIndex(c => c.id === id);
    if (index !== -1) {
      this.countries.splice(index, 1);
      return true;
    }
    return false;
  }

  clearAllData() {
    this.persons = [];
    this.relationships = [];
    this.branchReviewers = [];
    this.mergeRequests = [];
    this.countries = [];
  }
}

export const dbStore = new MemoryStore();
