/**
 * Get Paid — lien intake data model.
 *
 * A JobLien is a companion record to a Job (linked by jobId) holding the
 * intake fields from docs/lien-law-spec.md §1 that the deadline engine
 * (src/lib/deadlineEngine.js) needs to compute SC/NC mechanic's lien
 * deadlines. Kept separate from Job so a job can exist without lien data,
 * and so this record can grow without bloating the core Job shape.
 */

import { generateId } from '../lib/id';

/** Property states the Get Paid module currently has lien logic for. */
export const LIEN_STATES = ['SC', 'NC'];

/**
 * NC claimant tiers, ordered from strongest lien rights to weakest.
 * NOTE: the spec's tier rules (§3) only explicitly describe 'contractor',
 * the sub tiers, and 'more_remote'. Where 'supplier' falls is not stated —
 * see the manual_review item the engine emits for that tier.
 */
export const NC_CLAIMANT_TIERS = [
  'contractor',
  'first_tier_sub',
  'second_tier_sub',
  'third_tier_sub',
  'supplier',
  'more_remote',
];

/**
 * @typedef {Object} JobLien
 *
 * -- Identity --
 * @property {string} id
 * @property {string} jobId  // links back to the Job this lien data belongs to
 *
 * -- Both states (spec §1) --
 * @property {'SC'|'NC'|null} projectState  // property location, NOT company HQ
 * @property {string|null} lastFurnishedDate   // ISO date (YYYY-MM-DD) — last day labor/materials furnished; anchors filing + enforcement deadlines in both states
 *
 * -- NC only (spec §1, §3) --
 * @property {string|null} firstFurnishedDate  // ISO date — first day labor/materials furnished.
 *   NOT listed in the spec's §1 intake table (which only names "last date furnished" as the
 *   universal anchor), but §3 requires it to trigger NC's 15-day Lien Agent notice. Added here
 *   as its own field rather than reusing lastFurnishedDate — flag this gap for the spec author.
 * @property {boolean|null} ncOwnerOccupiedSingleFamilyResidence  // exempts the project from the Lien Agent requirement
 * @property {number|null} ncProjectValue        // drives the $40,000 Lien Agent threshold
 * @property {string|null} ncBuildingPermitIssueDate  // ISO date — anchors the GC's 30-day Notice of Contract
 * @property {(typeof NC_CLAIMANT_TIERS)[number]|null} ncClaimantTier
 *
 * -- SC only (spec §1, §2) --
 * @property {string} scContractorLicenseNumber  // must appear on the lien document; future doc generation should block on empty
 * @property {boolean|null} scNoticeOfCommencementFiled  // whether the GC filed a Notice of Commencement; determines if a sub should file a Notice of Furnishing
 *
 * @property {string} createdAt  // ISO datetime
 * @property {string} updatedAt  // ISO datetime
 */

/**
 * Builds a JobLien with sane defaults, overridden by whatever is passed in.
 * @param {Partial<JobLien>} overrides
 * @returns {JobLien}
 */
export function createJobLien(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? generateId(),
    jobId: overrides.jobId ?? null,
    projectState: null,
    lastFurnishedDate: null,
    firstFurnishedDate: null,
    ncOwnerOccupiedSingleFamilyResidence: null,
    ncProjectValue: null,
    ncBuildingPermitIssueDate: null,
    ncClaimantTier: null,
    scContractorLicenseNumber: '',
    scNoticeOfCommencementFiled: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
