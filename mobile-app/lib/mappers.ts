import { AuthUser, FactoryDashboardSummary, FactoryProfile, Job, JobApplication, UserType, Worker, WorkerProfile } from '../types';

type ApiRole = 'WORKER' | 'FACTORY';

export function roleToUserType(role: ApiRole): UserType {
  return role === 'FACTORY' ? 'factory' : 'worker';
}

export function mapAuthUser(input: {
  user: { id?: string; _id?: string; email: string; phone?: string; role: ApiRole };
  profile?: unknown;
}): AuthUser {
  const profile = input.profile as Partial<WorkerProfile & FactoryProfile> | undefined;
  const type = roleToUserType(input.user.role);
  const fallbackName = type === 'factory' ? 'Factory User' : 'Worker User';

  const name =
    type === 'factory'
      ? profile?.companyName || profile?.hrName || fallbackName
      : profile?.fullName || fallbackName;

  return {
    id: String(input.user.id || input.user._id || ''),
    name,
    email: input.user.email,
    phone: input.user.phone,
    type,
    role: input.user.role,
  };
}

export function mapJob(item: any): Job {
  const companyName = item?.factoryProfile?.companyName || item?.companyName || 'Factory';
  const payMin = Number(item?.payMin || 0);
  const payMax = Number(item?.payMax || 0);
  return {
    id: String(item?._id || item?.id || ''),
    company: companyName,
    companyName,
    area: item?.area || '',
    role: item?.title || item?.role || '',
    title: item?.title || item?.role || '',
    shift: item?.shift || '',
    pay: formatPay(payMin, payMax),
    payMin,
    payMax,
    skills: Array.isArray(item?.skillsRequired) ? item.skillsRequired : Array.isArray(item?.skills) ? item.skills : [],
    skillsRequired: Array.isArray(item?.skillsRequired) ? item.skillsRequired : Array.isArray(item?.skills) ? item.skills : [],
    description: item?.description || '',
    status: item?.status || 'OPEN',
    employmentType: item?.employmentType || 'Full-time',
  };
}

export function mapWorker(item: any): Worker {
  const experienceYears = Number(item?.experienceYears || 0);
  const salaryMin = Number(item?.salaryMin || 0);
  const preferredAreas = Array.isArray(item?.preferredAreas) ? item.preferredAreas : [];
  const preferredRoles = Array.isArray(item?.preferredRoles) ? item.preferredRoles : [];
  const preferredShifts = Array.isArray(item?.preferredShifts) ? item.preferredShifts : [];
  return {
    id: String(item?._id || item?.id || ''),
    name: item?.fullName || 'Worker',
    fullName: item?.fullName || 'Worker',
    area: preferredAreas[0] || 'Not specified',
    preferredAreas,
    role: preferredRoles[0] || 'Not specified',
    preferredRoles,
    experience: `${experienceYears || 0} years`,
    experienceYears,
    shift: preferredShifts[0] || 'Any',
    preferredShifts,
    salaryPreference: salaryMin > 0 ? `₹${salaryMin}+` : 'Negotiable',
    salaryMin,
    availability: item?.availability || 'Available',
    headline: item?.headline || '',
    skills: Array.isArray(item?.skills) ? item.skills : [],
    certifications: Array.isArray(item?.certifications) ? item.certifications : [],
    availableNow: item?.isOpenToWork ?? true,
    isOpenToWork: item?.isOpenToWork ?? true,
  };
}

export function mapWorkerProfile(item: any): WorkerProfile {
  return {
    id: String(item?._id || item?.id || ''),
    fullName: item?.fullName || '',
    headline: item?.headline || '',
    skills: Array.isArray(item?.skills) ? item.skills : [],
    preferredRoles: Array.isArray(item?.preferredRoles) ? item.preferredRoles : [],
    experienceYears: Number(item?.experienceYears || 0),
    certifications: Array.isArray(item?.certifications) ? item.certifications : [],
    preferredAreas: Array.isArray(item?.preferredAreas) ? item.preferredAreas : [],
    preferredShifts: Array.isArray(item?.preferredShifts) ? item.preferredShifts : [],
    salaryMin: Number(item?.salaryMin || 0),
    availability: item?.availability || '',
    isOpenToWork: item?.isOpenToWork ?? true,
  };
}

export function mapFactoryProfile(item: any): FactoryProfile {
  return {
    id: String(item?._id || item?.id || ''),
    companyName: item?.companyName || '',
    hrName: item?.hrName || '',
    industrialAreas: Array.isArray(item?.industrialAreas) ? item.industrialAreas : [],
    companySize: item?.companySize || '',
    description: item?.description || '',
  };
}

export function mapFactoryDashboardSummary(item: any): FactoryDashboardSummary {
  return {
    openJobs: Number(item?.openJobs || 0),
    totalApplications: Number(item?.totalApplications || 0),
    shortlisted: Number(item?.shortlisted || 0),
    hires: Number(item?.hires || 0),
  };
}

function formatPay(payMin: number, payMax: number) {
  if (payMin > 0 && payMax > 0) return `₹${payMin}–₹${payMax}`;
  if (payMin > 0) return `₹${payMin}+`;
  if (payMax > 0) return `Up to ₹${payMax}`;
  return 'Negotiable';
}

export function mapJobApplication(item: any): JobApplication {
  return {
    id: String(item?._id || item?.id || ''),
    jobId: String(item?.job?._id || item?.job || ''),
    workerUserId: item?.workerUser ? String(item.workerUser) : undefined,
    status: item?.status || 'APPLIED',
    note: item?.note || '',
    createdAt: item?.createdAt || '',
    updatedAt: item?.updatedAt || '',
    worker: mapWorker(item?.workerProfile || {}),
    job: item?.job && typeof item.job === 'object' ? mapJob(item.job) : undefined,
  };
}
