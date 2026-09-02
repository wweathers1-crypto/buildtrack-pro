import { calculateLienDeadlines } from './deadlineEngine';
import { createJobLien } from '../models/jobLien';

function itemsFor(overrides) {
  return calculateLienDeadlines(createJobLien(overrides));
}

function find(items, key) {
  return items.find((i) => i.key === key);
}

describe('South Carolina', () => {
  test('computes the 90-day filing and 6-month enforcement deadlines', () => {
    const items = itemsFor({ projectState: 'SC', lastFurnishedDate: '2026-01-01' });
    expect(find(items, 'sc_lien_filing').dueDate).toBe('2026-04-01');
    expect(find(items, 'sc_lien_enforcement').dueDate).toBe('2026-07-01');
  });

  test('call-back/warranty work is flagged for manual review, not auto-extended', () => {
    const items = itemsFor({ projectState: 'SC', lastFurnishedDate: '2026-01-01' });
    const callback = find(items, 'sc_callback_work');
    expect(callback.kind).toBe('manual_review');
    expect(callback.applies).toBe(true);
    // and the filing deadline itself is untouched by the callback flag
    expect(find(items, 'sc_lien_filing').dueDate).toBe('2026-04-01');
  });

  test('missing license number is surfaced as a warning', () => {
    const items = itemsFor({
      projectState: 'SC',
      lastFurnishedDate: '2026-01-01',
      scContractorLicenseNumber: '',
    });
    expect(find(items, 'sc_license_number_required').kind).toBe('warning');
  });

  test('present license number is compliance, not a warning', () => {
    const items = itemsFor({
      projectState: 'SC',
      lastFurnishedDate: '2026-01-01',
      scContractorLicenseNumber: 'SC-12345',
    });
    expect(find(items, 'sc_license_number_required').kind).toBe('compliance');
  });

  test('Notice of Furnishing only applies when GC filed a Notice of Commencement', () => {
    const filed = itemsFor({
      projectState: 'SC',
      lastFurnishedDate: '2026-01-01',
      scNoticeOfCommencementFiled: true,
    });
    const notFiled = itemsFor({
      projectState: 'SC',
      lastFurnishedDate: '2026-01-01',
      scNoticeOfCommencementFiled: false,
    });
    expect(find(filed, 'sc_notice_of_furnishing').applies).toBe(true);
    expect(find(notFiled, 'sc_notice_of_furnishing').applies).toBe(false);
  });
});

describe('North Carolina', () => {
  test('owner-occupied single-family residence exempts the Lien Agent notice', () => {
    const items = itemsFor({
      projectState: 'NC',
      firstFurnishedDate: '2026-01-01',
      ncProjectValue: 100000,
      ncOwnerOccupiedSingleFamilyResidence: true,
    });
    expect(find(items, 'nc_lien_agent_notice').applies).toBe(false);
  });

  test('$40,000 Lien Agent threshold boundary', () => {
    const atThreshold = itemsFor({
      projectState: 'NC',
      firstFurnishedDate: '2026-01-01',
      ncOwnerOccupiedSingleFamilyResidence: false,
      ncProjectValue: 40000,
    });
    const belowThreshold = itemsFor({
      projectState: 'NC',
      firstFurnishedDate: '2026-01-01',
      ncOwnerOccupiedSingleFamilyResidence: false,
      ncProjectValue: 39999,
    });
    expect(find(atThreshold, 'nc_lien_agent_notice').applies).toBe(true);
    expect(find(atThreshold, 'nc_lien_agent_notice').dueDate).toBe('2026-01-16');
    expect(find(belowThreshold, 'nc_lien_agent_notice').applies).toBe(false);
  });

  test('a missed Lien Agent notice is a priority-risk warning, not a hard stop', () => {
    const items = itemsFor({
      projectState: 'NC',
      firstFurnishedDate: '2026-01-01',
      ncOwnerOccupiedSingleFamilyResidence: false,
      ncProjectValue: 100000,
    });
    const risk = find(items, 'nc_lien_agent_priority_risk');
    expect(risk.kind).toBe('warning');
    expect(risk.applies).toBe(true);
  });

  test('120-day filing and 180-day enforcement deadlines', () => {
    const items = itemsFor({ projectState: 'NC', lastFurnishedDate: '2026-01-01', ncClaimantTier: 'contractor' });
    expect(find(items, 'nc_claim_of_lien_real_property').dueDate).toBe('2026-05-01');
    expect(find(items, 'nc_lien_enforcement').dueDate).toBe('2026-06-30');
  });

  test('tier more remote than 3rd: no real-property lien, flagged for manual review', () => {
    const items = itemsFor({
      projectState: 'NC',
      lastFurnishedDate: '2026-01-01',
      ncClaimantTier: 'more_remote',
    });
    expect(find(items, 'nc_claim_of_lien_real_property').applies).toBe(false);
    expect(find(items, 'nc_more_remote_restriction').applies).toBe(true);
    expect(find(items, 'nc_more_remote_funds_lien_gap').kind).toBe('manual_review');
  });

  test('1st/2nd/3rd-tier subs get the lien-upon-funds item; contractor does not', () => {
    const sub = itemsFor({ projectState: 'NC', lastFurnishedDate: '2026-01-01', ncClaimantTier: 'first_tier_sub' });
    const contractor = itemsFor({ projectState: 'NC', lastFurnishedDate: '2026-01-01', ncClaimantTier: 'contractor' });
    expect(find(sub, 'nc_lien_upon_funds').applies).toBe(true);
    expect(find(contractor, 'nc_lien_upon_funds').applies).toBe(false);
  });

  test('supplier tier is flagged as a spec gap rather than guessed at', () => {
    const items = itemsFor({ projectState: 'NC', lastFurnishedDate: '2026-01-01', ncClaimantTier: 'supplier' });
    expect(find(items, 'nc_supplier_tier_gap').kind).toBe('manual_review');
  });

  test('only the contractor gets the Notice of Contract item', () => {
    const items = itemsFor({
      projectState: 'NC',
      ncClaimantTier: 'contractor',
      ncBuildingPermitIssueDate: '2026-02-01',
    });
    expect(find(items, 'nc_notice_of_contract').applies).toBe(true);
    expect(find(items, 'nc_notice_of_contract').dueDate).toBe('2026-03-03');
  });
});

describe('dispatch', () => {
  test('returns no items when project state is not set', () => {
    expect(itemsFor({})).toEqual([]);
  });
});
