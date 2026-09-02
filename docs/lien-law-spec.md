# BuildTrackPro — Get Paid Module: SC/NC Lien Law Spec

**Purpose:** Reference spec for building the deadline engine, job intake fields, and notice/lien document templates for the Get Paid module. Sourced from current statutes and legal-industry publications as of 2026. This is a development spec, not a substitute for the attorney review still required before launch.

---

## 1. Job Intake — Required Fields

Every job record needs these fields to drive the deadline engine:

| Field | Applies To | Why |
|---|---|---|
| State of project (SC or NC) | Both | Project location, not company HQ — determines which rule set applies |
| Last date labor/materials furnished | Both | Anchor date for all deadline calculations |
| Owner-occupied single-family residence? (Y/N) | NC | Triggers exemption from Lien Agent requirement |
| Project value | NC | Determines if $40,000 Lien Agent threshold applies |
| Building permit issue date | NC | Anchor for contractor's 30-day Notice of Contract deadline |
| Claimant tier (Contractor / 1st-tier Sub / 2nd-tier Sub / 3rd-tier Sub / Supplier / More remote) | NC | Determines which lien rights and notices apply |
| Contractor's SC license/registration number | SC | Must appear on the lien document itself |
| Notice of Commencement filed by GC? (Y/N) | SC | Determines if subs should file Notice of Furnishing |

---

## 2. South Carolina — Rule Set (S.C. Code §29-5-10 et seq.)

**Structure:** Single-track — one filing clock, one enforcement clock. No mandatory preliminary notice.

| Step | Deadline | Trigger | Notes |
|---|---|---|---|
| Notice of Furnishing (optional) | No fixed deadline | Only relevant if GC filed a Notice of Commencement | Not required, but strengthens a subcontractor's position |
| Mechanic's Lien filing | 90 days | From last day labor/materials furnished | Applies to direct claimants and remote claimants alike |
| Lien enforcement (lawsuit + lis pendens) | 6 months | From last day labor/materials furnished | **No extensions available** — automatic expiration if missed |

**Quirks the engine must handle:**
- **Call-back/warranty work** may extend the 90-day filing deadline if the contractor returns to perform additional repair/warranty work — flag this as a manual-review case rather than auto-calculating, since it's fact-specific.
- **Personal service required** — the lien must be personally served on the owner; certified mail is not sufficient for the lien itself (though acceptable for other notices). Build this as a compliance checklist item, not just a document generator.
- **License number requirement** — auto-populate the contractor's SC license/registration number into the lien document; block generation if the field is empty.

---

## 3. North Carolina — Rule Set (N.C. Gen. Stat. Chapter 44A)

**Structure:** Multi-track — three overlapping deadlines plus a tiered claimant system that changes what a claimant can lien against.

| Step | Deadline | Trigger | Applies To |
|---|---|---|---|
| Notice to Lien Agent | 15 days | From first furnishing labor/materials | All claimants, on projects ≥$40,000 (unless owner-occupied single-family residence) |
| Notice of Contract (posted by GC) | 30 days | From building permit issuance | General contractors |
| Notice of Subcontract | No fixed deadline stated, but should follow GC's Notice of Contract | 2nd/3rd-tier claimants not in privity with GC | Subcontractors |
| Claim of Mechanic's Lien on Real Property | 120 days | From last furnishing labor/materials | All claimants |
| Lien enforcement (lawsuit) | 180 days | From last furnishing labor/materials | All claimants — missing this extinguishes the lien entirely |

**Tiered claimant logic (the most complex part to build):**

- **Contractor (direct with owner):** Full lien rights against real property.
- **1st/2nd/3rd-tier subcontractors:** Have a "lien upon funds" — perfected by serving a Notice of Claim of Lien upon Funds on whoever owes money up the chain (G.S. 44A-18, 44A-19). This should be modeled as a *separate document/deadline* from the real-property lien.
  - To reach the owner's real property, these tiers must: (1) serve the funds notice first, (2) then file the Claim of Lien on Real Property with that notice attached, (3) capped at whatever the owner still owes the general contractor at time of service.
- **More remote than 3rd-tier:** Lien on funds only — **no claim against real property is possible.** The engine should disable/hide the real-property lien document generation entirely for this tier.

**Consequence design note:** Missing the 15-day Lien Agent notice does *not* automatically kill lien rights — it only becomes fatal if the property is conveyed (sold/transferred) during the deadline window. Build this as a "priority risk" warning rather than a hard-stop, since the lien can still be valid if no conveyance occurs.

---

## 4. Side-by-Side Comparison

| | South Carolina | North Carolina |
|---|---|---|
| Preliminary notice required? | No (optional) | Yes — 15-day Lien Agent notice (with exemptions) |
| Lien filing deadline | 90 days | 120 days |
| Enforcement deadline | 6 months (~180 days) | 180 days |
| Extensions available? | No (except possible call-back work) | No |
| Tiered claimant system? | No | Yes — materially changes rights by tier |
| Project value threshold for notice? | N/A | $40,000 (Lien Agent requirement) |
| License number required on lien doc? | Yes | Not indicated in sources reviewed |

---

## 5. Build Priorities (from earlier phase plan)

1. Invoice/payment tracking — no state-specific logic, build first
2. Change order capture — no state-specific logic
3. Automated pay applications — no state-specific logic
4. **Lien/notice deadline tracker — this spec** — highest legal complexity, build last within the module, gate launch on attorney review

---

## 6. Pre-Launch Checklist

- [ ] Attorney review of deadline calculation logic (both states)
- [ ] Attorney review of auto-generated notice/lien document templates for statutory compliance
- [ ] Confirm NC tier logic matches what the app asks users and generates
- [ ] ToS/disclaimer language finalized: tool is a compliance aid, not legal advice; users should independently confirm critical deadlines
- [ ] Test cases built for: SC call-back work edge case, NC owner-occupied exemption, NC $40k threshold boundary, NC tier-4+ (funds-only) restriction

---

*Sources reviewed: S.C. Code §29-5-10 et seq.; N.C. Gen. Stat. Chapter 44A (§44A-7 through 24); industry legal publications (Levelset, Billd, Siteline, CRM Lien Services, Ward and Smith P.A., National Lien & Bond, SC Legal) current as of 2026. This document reflects publicly available secondary-source summaries of statute, not primary legal research — attorney verification against current statutory text is required before any deadline logic or template ships to customers.*
