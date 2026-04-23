export type UserType = 'worker' | 'factory';
export type ApiRole = 'WORKER' | 'FACTORY';

export type Job = {
  id: string;
  company: string;
  companyName?: string;
  area: string;
  role: string;
  title?: string;
  shift: string;
  pay: string;
  payMin?: number;
  payMax?: number;
  skills: string[];
  skillsRequired?: string[];
  description?: string;
  status?: string;
  employmentType?: string;
};

export type Worker = {
  id: string;
  name: string;
  fullName?: string;
  area: string;
  preferredAreas?: string[];
  role: string;
  preferredRoles?: string[];
  experience: string;
  experienceYears?: number;
  shift: string;
  preferredShifts?: string[];
  salaryPreference: string;
  salaryMin?: number;
  availability?: string;
  headline?: string;
  skills: string[];
  certifications: string[];
  availableNow: boolean;
  isOpenToWork?: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: UserType;
  role: ApiRole;
};

export type WorkerProfile = {
  id: string;
  fullName: string;
  headline?: string;
  skills: string[];
  preferredRoles: string[];
  experienceYears: number;
  certifications: string[];
  preferredAreas: string[];
  preferredShifts: string[];
  salaryMin: number;
  availability?: string;
  isOpenToWork: boolean;
};

export type FactoryProfile = {
  id: string;
  companyName: string;
  hrName: string;
  industrialAreas: string[];
  companySize?: string;
  description?: string;
};

export type FactoryDashboardSummary = {
  openJobs: number;
  totalApplications: number;
  shortlisted: number;
  hires: number;
};

export type JobApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW' | 'HIRED' | 'REJECTED';

export type JobApplication = {
  id: string;
  jobId: string;
  workerUserId?: string;
  status: JobApplicationStatus;
  note?: string;
  updatedAt?: string;
  createdAt?: string;
  worker: Worker;
  job?: Job;
};

export type SavedJob = {
  jobId: string;
  savedAt: string;
  job: Job;
};

export type HirePayload = {
  proposedPay: number;
  joiningDate?: string;
};
