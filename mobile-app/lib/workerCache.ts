import { Worker } from '../types';

const cache = new Map<string, Worker>();

export const workerCache = {
  set: (worker: Worker) => cache.set(worker.id, worker),
  setAll: (workers: Worker[]) => workers.forEach((w) => cache.set(w.id, w)),
  get: (id: string) => cache.get(id) ?? null,
};
