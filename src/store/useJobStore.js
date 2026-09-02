import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createJob } from '../models/job';

/**
 * Global job store. Persisted to localStorage for now — there's no backend
 * yet, so this is the system of record. Swapping in a real API later means
 * changing the actions below; components that call them stay the same.
 */
export const useJobStore = create(
  persist(
    (set, get) => ({
      jobs: [],

      addJob: (jobData) => {
        const job = createJob(jobData);
        set((state) => ({ jobs: [...state.jobs, job] }));
        return job;
      },

      updateJob: (id, updates) => {
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id
              ? { ...job, ...updates, updatedAt: new Date().toISOString() }
              : job
          ),
        }));
      },

      deleteJob: (id) => {
        set((state) => ({ jobs: state.jobs.filter((job) => job.id !== id) }));
      },

      getJobById: (id) => get().jobs.find((job) => job.id === id),
    }),
    { name: 'buildtrack-jobs' }
  )
);
