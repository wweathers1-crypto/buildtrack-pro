import { generateId } from '../lib/id';

/**
 * @typedef {'lead'|'active'|'on_hold'|'complete'|'cancelled'} JobStatus
 */
export const JOB_STATUSES = ['lead', 'active', 'on_hold', 'complete', 'cancelled'];

/** Property states the Get Paid module currently has lien-deadline support for. */
export const LIEN_SUPPORTED_STATES = ['SC', 'NC'];

/**
 * @typedef {Object} JobAddress
 * @property {string} street
 * @property {string} city
 * @property {string} state  // two-letter code of the PROPERTY location, not the company's HQ
 * @property {string} zip
 */

/**
 * @typedef {Object} Job
 * @property {string} id
 * @property {string} name
 * @property {string} clientName
 * @property {string} clientEmail
 * @property {string} clientPhone
 * @property {JobAddress} address
 * @property {JobStatus} status
 * @property {number|null} contractAmount
 * @property {string|null} startDate      // ISO date string
 * @property {string|null} targetEndDate  // ISO date string
 * @property {string} notes
 * @property {string} createdAt  // ISO datetime string
 * @property {string} updatedAt  // ISO datetime string
 */

/**
 * Builds a Job with sane defaults, overridden by whatever is passed in.
 * @param {Partial<Job>} overrides
 * @returns {Job}
 */
export function createJob(overrides = {}) {
  const now = new Date().toISOString();
  const { address: addressOverrides, ...rest } = overrides;
  return {
    id: overrides.id ?? generateId(),
    name: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    address: { street: '', city: '', state: '', zip: '', ...addressOverrides },
    status: 'lead',
    contractAmount: null,
    startDate: null,
    targetEndDate: null,
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...rest,
  };
}

/** @param {Job} job */
export function isLienTrackingSupported(job) {
  return LIEN_SUPPORTED_STATES.includes(job?.address?.state);
}
