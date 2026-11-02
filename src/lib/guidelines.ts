import sourceData from '../data/sources.json';
import recommendationData from '../data/recommendations.json';
import doseData from '../data/doses.json';
import versionData from '../data/versions.json';
import Fuse from 'fuse.js';

export type Topic = 'vaccinations' | 'dyslipidemia' | 'hypertension' | 'heart-failure' | 'prevention';
export type Source = (typeof sourceData)[number];
export type Recommendation = Omit<(typeof recommendationData)[number], 'topic'> & { topic: Topic };
export const sources = sourceData;
export const recommendations = recommendationData as Recommendation[];
export const doses = doseData;
export const versions = versionData;
export const sourceFor = (r: Recommendation) => sources.find(s => s.id === r.sourceId)!;
export const topics: { id: Topic; title: string; short: string; description: string; society: string; color: string }[] = [
  { id: 'vaccinations', title: 'Adult vaccinations', short: 'Vaccinations', description: 'Age, history, and risk-based immunization guidance.', society: 'CDC / ACIP', color: 'sage' },
  { id: 'dyslipidemia', title: 'Dyslipidemia', short: 'Dyslipidemia', description: 'Statin eligibility, intensity, and LDL-C goals.', society: 'ACC / AHA · VA / DoD', color: 'blue' },
  { id: 'hypertension', title: 'Hypertension', short: 'Hypertension', description: 'Treatment thresholds and blood pressure goals.', society: 'ACC / AHA · VA / DoD', color: 'ochre' },
  { id: 'heart-failure', title: 'Heart failure GDMT', short: 'Heart failure', description: 'The four pillars, with starting and target doses.', society: 'AHA / ACC / HFSA', color: 'rose' },
  { id: 'prevention', title: 'Primary prevention', short: 'Prevention', description: 'Selected aspirin and osteoporosis recommendations.', society: 'USPSTF', color: 'sage' }
];

const index = new Fuse(recommendations.map(r => ({ ...r, society: sourceFor(r).society })), {
  keys: [{ name: 'title', weight: 2 }, 'tags', 'summary', 'population', 'society'],
  threshold: 0.28, ignoreLocation: true
});
export function searchRecommendations(query: string, topic?: Topic, society = 'all') {
  const hits = query.trim() ? index.search(query.trim()).map(h => h.item) : recommendations;
  return hits.filter(r => (!topic || r.topic === topic) &&
    (society === 'all' || sourceFor(r).society.includes(society)));
}

export type VaccineHistory = 'none' | 'complete' | 'partial' | 'unknown';
export interface FictionalCase {
  age: number; sex: 'female' | 'male'; diabetes: boolean; ckd: boolean;
  veteran: boolean; ascvd: boolean; multipleRiskFactors: boolean;
  sbp: number; dbp: number; ldl: number;
  hf: boolean; ef: number; nyha: 'I' | 'II' | 'III' | 'IV'; egfr: number; potassium: number;
  immunocompromised: boolean; secondaryBoneDisease: boolean;
  influenza: VaccineHistory; zoster: VaccineHistory;
  pneumococcal: VaccineHistory; hepb: VaccineHistory;
}
export const profiles: { id: string; name: string; description: string; data: FictionalCase }[] = [
  { id: 'diabetes', name: 'Diabetes & lipids', description: 'Age 47 · diabetes · LDL-C 115', data: {
    age: 47, sex: 'male', diabetes: true, ckd: false, veteran: true, ascvd: false,
    multipleRiskFactors: false, sbp: 134, dbp: 82, ldl: 115,
    hf: false, ef: 55, nyha: 'II', egfr: 78, potassium: 4.2, immunocompromised: false,
    secondaryBoneDisease: false, influenza: 'unknown', zoster: 'unknown', pneumococcal: 'unknown', hepb: 'unknown'
  } },
  { id: 'vaccines', name: 'Vaccination check', description: 'Age 58 · incomplete history', data: {
    age: 58, sex: 'female', diabetes: false, ckd: false, veteran: false, ascvd: false,
    multipleRiskFactors: false, sbp: 118, dbp: 74, ldl: 105,
    hf: false, ef: 60, nyha: 'II', egfr: 90, potassium: 4.1, immunocompromised: false,
    secondaryBoneDisease: false, influenza: 'none', zoster: 'none', pneumococcal: 'unknown', hepb: 'partial'
  } },
  { id: 'hf', name: 'HFrEF overview', description: 'Age 64 · LVEF 30% · NYHA II', data: {
    age: 64, sex: 'male', diabetes: false, ckd: false, veteran: true, ascvd: false,
    multipleRiskFactors: false, sbp: 126, dbp: 76, ldl: 95,
    hf: true, ef: 30, nyha: 'II', egfr: 62, potassium: 4.3, immunocompromised: false,
    secondaryBoneDisease: false, influenza: 'complete', zoster: 'complete', pneumococcal: 'complete', hepb: 'complete'
  } },
  { id: 'prevention', name: 'Primary prevention', description: 'Age 67 · routine prevention', data: {
    age: 67, sex: 'female', diabetes: false, ckd: false, veteran: false, ascvd: false,
    multipleRiskFactors: false, sbp: 144, dbp: 88, ldl: 120,
    hf: false, ef: 60, nyha: 'II', egfr: 85, potassium: 4.2, immunocompromised: false,
    secondaryBoneDisease: false, influenza: 'complete', zoster: 'complete', pneumococcal: 'complete', hepb: 'complete'
  } }
];

export function validateCase(c: FictionalCase): string[] {
  const errors: string[] = [];
  const range = (value: number, min: number, max: number, label: string) => {
    if (!Number.isFinite(value) || value < min || value > max) errors.push(`${label} must be ${min}–${max}.`);
  };
  range(c.age, 19, 100, 'Fictional age');
  if (!Number.isInteger(c.age)) errors.push('Fictional age must be a whole number.');
  range(c.sbp, 70, 250, 'Systolic BP'); range(c.dbp, 40, 150, 'Diastolic BP');
  if (c.sbp <= c.dbp) errors.push('Systolic BP must exceed diastolic BP.');
  range(c.ldl, 10, 500, 'LDL-C'); range(c.egfr, 0, 150, 'eGFR');
  range(c.ef, 5, 80, 'LVEF'); range(c.potassium, 2, 7, 'Potassium');
  return errors;
}
export interface Match { recommendation: Recommendation; reason: string; context?: string }
export function evaluateCase(c: FictionalCase): { matches: Match[]; gaps: string[]; errors: string[] } {
  const errors = validateCase(c);
  if (errors.length) return { matches: [], gaps: [], errors };
  const matches: Match[] = [];
  const gaps = ['Selected reference pathways only. A missing match does not mean a guideline recommends no care.',
    'All matches await independent medical verification. Contraindications, medications, pregnancy, frailty, and full risk assessment are not evaluated.'];
  const add = (rule: string, reason: string, context?: string) => {
    const recommendation = recommendations.find(r => r.rule === rule)!;
    matches.push({ recommendation, reason, context });
  };
  if (c.influenza !== 'complete') add('influenza', 'Adult age; no current-season vaccination documented in this fictional case.');
  if (c.age >= 50 && c.zoster !== 'complete' && !c.immunocompromised && c.zoster !== 'partial') add('zoster', 'Age ≥50; fictional RZV history is absent or unknown.');
  if (c.zoster === 'partial') gaps.push('Incomplete RZV series: review actual dose dates in the primary schedule; no dose is calculated here.');
  if (c.immunocompromised) gaps.push('Immunocompromised vaccination pathways are not encoded; review the primary schedule.');
  if (c.age >= 50 && ['none', 'unknown'].includes(c.pneumococcal)) add('pneumococcal', 'Age ≥50; fictional conjugate vaccine history is absent or unknown.');
  if (c.pneumococcal === 'partial') gaps.push('Prior pneumococcal doses require product and date review; no catch-up pathway is encoded.');
  if (c.age >= 19 && c.age <= 59 && c.hepb !== 'complete') add('hepb', 'Age 19–59; fictional HepB series is not documented as complete.', 'Review prior products and dates before completing a series.');
  if (!c.ascvd && c.diabetes && c.age >= 40 && c.age <= 75) {
    if (c.multipleRiskFactors) add('diabetes-high-risk', 'Age 40–75, diabetes, no clinical ASCVD, and multiple risk factors explicitly selected.');
    else add('diabetes-statin', 'Age 40–75 with diabetes and no clinical ASCVD. LDL-C alone does not determine eligibility.');
  }
  if (c.veteran && !c.ascvd && !(c.hf && c.ef <= 35) && c.egfr >= 15 && (c.diabetes || c.ldl >= 190)) add('va-statin', c.diabetes ? 'VA/DoD context and diabetes; no encoded scope exclusion triggered.' : 'VA/DoD context and LDL-C ≥190 mg/dL.', 'Limited life expectancy and all scope exclusions still require clinician review.');
  if (c.hf && c.ef <= 35 && c.veteran) gaps.push('VA/DoD lipid guideline scope excludes HFrEF with EF ≤35%; that statin pathway has been withheld.');
  if (c.sbp >= 140 || c.dbp >= 90) add('hypertension', 'Fictional average BP reaches systolic ≥140 or diastolic ≥90 mmHg.');
  if (!c.ascvd && c.sbp >= 130 && (c.diabetes || c.ckd)) add('hypertension-risk', 'Average systolic BP ≥130, no clinical CVD selected, with diabetes or CKD.');
  if (c.veteran && (c.sbp >= 140 || c.dbp >= 90 || c.diabetes && c.sbp >= 130 || c.ckd && c.sbp >= 130)) add('va-hypertension', 'VA/DoD context with a hypertension reference pathway.');
  if (c.sbp >= 180 || c.dbp >= 120) gaps.push('Severely elevated fictional BP is outside routine prototype triage; no urgency assessment is provided.');
  if (c.hf && c.ef <= 40) {
    if (['II', 'III'].includes(c.nyha)) add('hf-arni', 'Fictional HFrEF with LVEF ≤40% and NYHA II–III.', 'Reference match only; BP, angioedema and ACE inhibitor washout not assessed.');
    add('hf-beta', 'Fictional HFrEF with current or previous symptoms selected.');
    if (c.nyha !== 'I') {
      add('hf-sglt2', 'Fictional symptomatic chronic HFrEF; diabetes is not required.');
      if (c.egfr > 30 && c.potassium < 5) add('hf-mra', 'NYHA II–IV, eGFR >30 and potassium <5.0 in the fictional case.');
      else gaps.push('The encoded MRA eligibility criteria are not met: eGFR must be >30 and potassium <5.0. This is not a complete contraindication assessment.');
    }
  }
  if (!c.ascvd && c.age >= 60) add('aspirin', 'Age ≥60 and no known clinical CVD selected; primary-prevention initiation reference.', 'Do not interpret this as advice to stop existing therapy. Bleeding risk was not assessed.');
  if (!c.secondaryBoneDisease) {
    if (c.sex === 'female' && c.age >= 65) add('osteoporosis', 'Woman aged ≥65; no known bone disease or prior fragility fracture selected.');
    if (c.sex === 'male') add('osteoporosis-men', 'Male case: USPSTF reports insufficient screening evidence.', 'An I statement is not a recommendation against screening.');
  }
  if (c.ascvd) gaps.push('Clinical ASCVD selected: primary-prevention lipid and aspirin pathways are withheld. Secondary prevention is not encoded.');
  gaps.push('COVID-19, RSV, Tdap, other vaccines, younger-adult risk pathways, and complete screening recommendations are not encoded.');
  return { matches, gaps, errors: [] };
}
