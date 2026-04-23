import { getStoredItem, setStoredItem } from '../lib/storage';
import { Job, SavedJob } from '../types';

const SAVED_JOBS_KEY = 'sketu.saved-jobs';

type SavedJobsMap = Record<string, SavedJob>;

async function readSavedJobsMap(): Promise<SavedJobsMap> {
  const raw = await getStoredItem(SAVED_JOBS_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as SavedJobsMap;
    return parsed || {};
  } catch {
    return {};
  }
}

async function writeSavedJobsMap(input: SavedJobsMap) {
  await setStoredItem(SAVED_JOBS_KEY, JSON.stringify(input));
}

export async function listSavedJobs() {
  const map = await readSavedJobsMap();
  return Object.values(map).sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export async function isJobSaved(jobId: string) {
  const map = await readSavedJobsMap();
  return Boolean(map[jobId]);
}

export async function saveJob(job: Job) {
  const map = await readSavedJobsMap();
  map[job.id] = {
    jobId: job.id,
    savedAt: new Date().toISOString(),
    job,
  };
  await writeSavedJobsMap(map);
  return Object.values(map);
}

export async function unsaveJob(jobId: string) {
  const map = await readSavedJobsMap();
  delete map[jobId];
  await writeSavedJobsMap(map);
  return Object.values(map);
}

export async function toggleSavedJob(job: Job) {
  const map = await readSavedJobsMap();
  const wasSaved = Boolean(map[job.id]);
  if (wasSaved) {
    delete map[job.id];
  } else {
    map[job.id] = {
      jobId: job.id,
      savedAt: new Date().toISOString(),
      job,
    };
  }
  await writeSavedJobsMap(map);
  return !wasSaved;
}
