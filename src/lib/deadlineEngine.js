/**
 * Get Paid — SC/NC mechanic's lien deadline engine.
 *
 * Computes deadline and compliance items from a JobLien record, per
 * docs/lien-law-spec.md. Deliberately produces DATA only — no notice or
 * lien document generation yet (that's the next phase, after this is
 * reviewed). Anything the spec marks as fact-specific or not fully
 * specified is surfaced as a `manual_review` item rather than guessed at.
 *
 * IMPORTANT: this reflects a non-attorney-reviewed development spec.
 * Do not treat this module's output as legal advice — see
 * docs/lien-law-spec.md's pre-launch checklist.
 */

// ---- date helpers -----------------------------------------------------
// All arithmetic is done in UTC on the Y/M/D components directly, so a
// deadline computed from a stored ISO date (YYYY-MM-DD) doesn't shift by a
// day depending on the browser/server's local timezone.

function parseIsoDate(isoDate) {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(isoDate, days) {
  const d = parseIsoDate(isoDate);
  if (!d) return null;
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

function addMonths(isoDate, months) {
  const d = parseIsoDate(isoDate);
  if (!d) return null;
  d.setUTCMonth(d.getUTCMonth() + months);
  return toIsoDate(d);
}

// ---- item shape ---------------------------------------------------------

/**
 * @typedef {Object} DeadlineItem
 * @property {string} key
 * @property {string} label
 * @property {string|null} dueDate  // ISO date, or null if not date-based / can't be computed yet
 * @property {'deadline'|'compliance'|'warning'|'manual_review'} kind
 * @property {string} description
 * @property {boolean} applies  // whether this item is relevant to this claimant/job as currently entered
 */

// ---- South Carolina (spec §2) -------------------------------------------

export function calculateScDeadlines(lien) {
  /** @type {DeadlineItem[]} */
  const items = [];

  items.push({
    key: 'sc_lien_filing',
    label: "Mechanic's Lien filing deadline",
    dueDate: addDays(lien.lastFurnishedDate, 90),
    kind: 'deadline',
    description:
      '90 days from the last date labor/materials furnished. Applies to direct and remote claimants alike.',
    applies: true,
  });

  items.push({
    key: 'sc_lien_enforcement',
    label: 'Lien enforcement deadline (lawsuit + lis pendens)',
    dueDate: addMonths(lien.lastFurnishedDate, 6),
    kind: 'deadline',
    description:
      '6 months from the last date labor/materials furnished. No extensions available — automatic expiration if missed.',
    applies: true,
  });

  items.push({
    key: 'sc_notice_of_furnishing',
    label: 'Notice of Furnishing (optional)',
    dueDate: null,
    kind: 'compliance',
    description: lien.scNoticeOfCommencementFiled
      ? 'The GC filed a Notice of Commencement. Filing a Notice of Furnishing is optional but strengthens this claim.'
      : 'No fixed deadline. Only relevant if the GC filed a Notice of Commencement.',
    applies: Boolean(lien.scNoticeOfCommencementFiled),
  });

  items.push({
    key: 'sc_personal_service',
    label: 'Personal service on owner required',
    dueDate: null,
    kind: 'compliance',
    description:
      'The lien must be personally served on the owner — certified mail is not sufficient for the lien itself (though it is acceptable for other notices).',
    applies: true,
  });

  items.push({
    key: 'sc_license_number_required',
    label: 'Contractor license number required on lien document',
    dueDate: null,
    kind: lien.scContractorLicenseNumber ? 'compliance' : 'warning',
    description: lien.scContractorLicenseNumber
      ? `License/registration number on file: ${lien.scContractorLicenseNumber}`
      : 'Missing. Lien document generation should be blocked until this is provided.',
    applies: true,
  });

  items.push({
    key: 'sc_callback_work',
    label: 'Call-back / warranty work — manual review',
    dueDate: null,
    kind: 'manual_review',
    description:
      'If the contractor returns to perform additional repair/warranty work, the 90-day filing deadline may be extended. This is fact-specific — do not auto-extend; flag for manual review.',
    applies: true,
  });

  return items;
}

// ---- North Carolina (spec §3) -------------------------------------------

const NC_FUNDS_LIEN_TIERS = ['first_tier_sub', 'second_tier_sub', 'third_tier_sub'];
const NC_SUBCONTRACT_NOTICE_TIERS = ['second_tier_sub', 'third_tier_sub'];

export function calculateNcDeadlines(lien) {
  /** @type {DeadlineItem[]} */
  const items = [];

  const isExempt = Boolean(lien.ncOwnerOccupiedSingleFamilyResidence);
  const meetsThreshold =
    typeof lien.ncProjectValue === 'number' && lien.ncProjectValue >= 40000;
  const lienAgentApplies = meetsThreshold && !isExempt;

  items.push({
    key: 'nc_lien_agent_notice',
    label: 'Notice to Lien Agent',
    dueDate: lienAgentApplies ? addDays(lien.firstFurnishedDate, 15) : null,
    kind: 'deadline',
    description: lienAgentApplies
      ? '15 days from first furnishing labor/materials. Applies because the project is $40,000+ and is not an owner-occupied single-family residence.'
      : isExempt
        ? 'Not required — owner-occupied single-family residence exemption applies.'
        : 'Not required — project value is below the $40,000 threshold (or value not yet entered).',
    applies: lienAgentApplies,
  });

  items.push({
    key: 'nc_lien_agent_priority_risk',
    label: 'Lien Agent notice — priority risk if missed',
    dueDate: null,
    kind: 'warning',
    description:
      'Missing the 15-day notice does not automatically kill lien rights — it only becomes fatal if the property is conveyed during the deadline window. Treat as a priority-risk warning, not a hard stop.',
    applies: lienAgentApplies,
  });

  items.push({
    key: 'nc_notice_of_contract',
    label: 'Notice of Contract (GC posts)',
    dueDate: addDays(lien.ncBuildingPermitIssueDate, 30),
    kind: 'deadline',
    description: '30 days from building permit issuance. Applies to general contractors.',
    applies: lien.ncClaimantTier === 'contractor',
  });

  items.push({
    key: 'nc_notice_of_subcontract',
    label: 'Notice of Subcontract',
    dueDate: null,
    kind: 'compliance',
    description:
      "No fixed statutory deadline stated — should follow the GC's Notice of Contract. Applies to 2nd/3rd-tier claimants not in privity with the GC.",
    applies: NC_SUBCONTRACT_NOTICE_TIERS.includes(lien.ncClaimantTier),
  });

  items.push({
    key: 'nc_claim_of_lien_real_property',
    label: "Claim of Mechanic's Lien on Real Property",
    dueDate: addDays(lien.lastFurnishedDate, 120),
    kind: 'deadline',
    description:
      "120 days from last furnishing labor/materials. Applies to all claimants except tiers more remote than 3rd — see the more-remote restriction item.",
    applies: lien.ncClaimantTier !== 'more_remote',
  });

  items.push({
    key: 'nc_lien_enforcement',
    label: 'Lien enforcement (lawsuit)',
    dueDate: addDays(lien.lastFurnishedDate, 180),
    kind: 'deadline',
    description:
      '180 days from last furnishing labor/materials. Missing this extinguishes the lien entirely.',
    applies: true,
  });

  items.push({
    key: 'nc_lien_upon_funds',
    label: 'Notice of Claim of Lien upon Funds',
    dueDate: null,
    kind: 'compliance',
    description:
      'Perfected by serving notice on whoever owes money up the chain (G.S. 44A-18, 44A-19). Must be served before a real-property lien can be filed for this tier; any resulting real-property claim is capped at what the owner still owed the GC at time of service. Modeled as a separate document/deadline from the real-property lien.',
    applies: NC_FUNDS_LIEN_TIERS.includes(lien.ncClaimantTier),
  });

  items.push({
    key: 'nc_more_remote_restriction',
    label: 'Lien on funds only — no real-property lien available',
    dueDate: null,
    kind: 'warning',
    description:
      'This tier is more remote than 3rd-tier: real-property lien document generation should be disabled/hidden entirely. Only a lien on funds is available.',
    applies: lien.ncClaimantTier === 'more_remote',
  });

  if (lien.ncClaimantTier === 'more_remote') {
    items.push({
      key: 'nc_more_remote_funds_lien_gap',
      label: 'More-remote lien on funds — perfection mechanism not detailed in spec',
      dueDate: null,
      kind: 'manual_review',
      description:
        'The spec confirms a more-remote claimant has a lien on funds (no real-property lien), but the G.S. 44A-18/19 notice mechanics it describes are specific to 1st/2nd/3rd-tier subs. Confirm the correct notice and deadline for this tier before generating any documents.',
      applies: true,
    });
  }

  if (lien.ncClaimantTier === 'supplier') {
    items.push({
      key: 'nc_supplier_tier_gap',
      label: 'Supplier tier — lien path not detailed in spec',
      dueDate: null,
      kind: 'manual_review',
      description:
        "The spec lists Supplier as its own claimant tier but its tier rules only describe Contractor, 1st/2nd/3rd-tier Subcontractor, and More Remote. Confirm whether a supplier follows the direct real-property lien path or the funds-lien path before relying on this tier's other line items.",
      applies: true,
    });
  }

  return items;
}

// ---- dispatch -------------------------------------------------------------

/**
 * @param {import('../models/jobLien').JobLien} lien
 * @returns {DeadlineItem[]}
 */
export function calculateLienDeadlines(lien) {
  if (!lien || !lien.projectState) return [];
  if (lien.projectState === 'SC') return calculateScDeadlines(lien);
  if (lien.projectState === 'NC') return calculateNcDeadlines(lien);
  return [];
}
