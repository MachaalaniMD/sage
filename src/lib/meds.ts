// Current-therapy inputs and the VA formulary classes the plan can suggest.
// Statin intensity follows src/data/statin-intensities.json (ACC/AHA 2026 Table 6).

export type StatinIntensity = 'none' | 'low' | 'moderate' | 'high';
export const intensityRank: Record<StatinIntensity, number> = { none: 0, low: 1, moderate: 2, high: 3 };

export const statinDrugs: { id: string; label: string; doses: number[]; unit: string }[] = [
  { id: 'atorvastatin', label: 'Atorvastatin', doses: [10, 20, 40, 80], unit: 'mg' },
  { id: 'rosuvastatin', label: 'Rosuvastatin', doses: [5, 10, 20, 40], unit: 'mg' },
  { id: 'simvastatin', label: 'Simvastatin', doses: [10, 20, 40], unit: 'mg' },
  { id: 'pravastatin', label: 'Pravastatin', doses: [10, 20, 40, 80], unit: 'mg' },
  { id: 'lovastatin', label: 'Lovastatin', doses: [20, 40, 80], unit: 'mg' },
  { id: 'pitavastatin', label: 'Pitavastatin', doses: [1, 2, 4], unit: 'mg' },
  { id: 'fluvastatin', label: 'Fluvastatin', doses: [20, 40, 80], unit: 'mg/day' }
];

const table: Record<string, Record<number, StatinIntensity>> = {
  atorvastatin: { 10: 'moderate', 20: 'moderate', 40: 'high', 80: 'high' },
  rosuvastatin: { 5: 'moderate', 10: 'moderate', 20: 'high', 40: 'high' },
  simvastatin: { 10: 'low', 20: 'moderate', 40: 'moderate' },
  pravastatin: { 10: 'low', 20: 'low', 40: 'moderate', 80: 'moderate' },
  lovastatin: { 20: 'low', 40: 'moderate', 80: 'moderate' },
  pitavastatin: { 1: 'moderate', 2: 'moderate', 4: 'moderate' },
  fluvastatin: { 20: 'low', 40: 'low', 80: 'moderate' }
};

export function statinIntensity(drug: string, dose: number): StatinIntensity {
  if (!drug || drug === 'none') return 'none';
  return table[drug]?.[dose] ?? 'none';
}

export const statinLabel = (drug: string, dose: number) => {
  const d = statinDrugs.find(s => s.id === drug);
  return d ? `${d.label} ${dose} ${d.unit}` : 'no statin';
};

// High-intensity targets used when a statin should be started or intensified.
export const highIntensityOptions = ['atorvastatin 40–80 mg', 'rosuvastatin 20–40 mg'];
export const moderateIntensityOptions = ['atorvastatin 10–20 mg', 'rosuvastatin 5–10 mg', 'simvastatin 20–40 mg', 'pravastatin 40–80 mg'];

// Exact VA national formulary names (src/data/va-formulary.json) per drug class.
// Resolved lazily against the bundled snapshot so the 1.5 MB file loads only in VA mode.
export type FormularyClass =
  | 'statin-high' | 'statin-moderate' | 'ezetimibe' | 'pcsk9' | 'acearb' | 'thiazide' | 'ccb'
  | 'sglt2' | 'glp1' | 'nsmra' | 'mra' | 'arni' | 'betablocker-hf' | 'p2y12' | 'tobacco' | 'metformin';

export const formularyClasses: Record<FormularyClass, { label: string; names: string[] }> = {
  'statin-high': { label: 'High-intensity statin', names: ['ATORVASTATIN TAB', 'ROSUVASTATIN TAB'] },
  'statin-moderate': { label: 'Moderate-intensity statin', names: ['ATORVASTATIN TAB', 'ROSUVASTATIN TAB', 'SIMVASTATIN TAB', 'PRAVASTATIN TAB'] },
  ezetimibe: { label: 'Ezetimibe', names: ['EZETIMIBE TAB'] },
  pcsk9: { label: 'PCSK9 inhibitor', names: ['EVOLOCUMAB INJ,SOLN', 'ALIROCUMAB INJ,SOLN', 'INCLISIRAN INJ,SOLN'] },
  acearb: { label: 'ACE inhibitor / ARB', names: ['LISINOPRIL TAB', 'LOSARTAN TAB', 'VALSARTAN TAB'] },
  thiazide: { label: 'Thiazide-type diuretic', names: ['CHLORTHALIDONE TAB', 'HYDROCHLOROTHIAZIDE TAB'] },
  ccb: { label: 'Calcium channel blocker', names: ['AMLODIPINE TAB'] },
  sglt2: { label: 'SGLT2 inhibitor', names: ['EMPAGLIFLOZIN TAB,ORAL', 'DAPAGLIFLOZIN TAB,ORAL'] },
  glp1: { label: 'GLP-1 receptor agonist', names: ['SEMAGLUTIDE INJ,SOLN', 'LIRAGLUTIDE INJ,SOLN', 'DULAGLUTIDE INJ,SOLN'] },
  nsmra: { label: 'Nonsteroidal MRA', names: ['FINERENONE TAB'] },
  mra: { label: 'Steroidal MRA', names: ['SPIRONOLACTONE TAB', 'EPLERENONE TAB'] },
  arni: { label: 'ARNI', names: ['SACUBITRIL/ VALSARTAN TAB'] },
  'betablocker-hf': { label: 'Evidence-based HF beta-blocker', names: ['CARVEDILOL TAB', 'METOPROLOL TAB,SA', 'BISOPROLOL TAB'] },
  p2y12: { label: 'P2Y12 inhibitor', names: ['CLOPIDOGREL TAB', 'TICAGRELOR TAB,ORAL', 'PRASUGREL TAB'] },
  tobacco: { label: 'Tobacco cessation', names: ['VARENICLINE TAB', 'NICOTINE PATCH', 'NICOTINE POLACRILEX GUM,CHEWABLE', 'NICOTINE POLACRILEX LOZENGE'] },
  metformin: { label: 'Metformin', names: ['METFORMIN TAB'] }
};

export interface FormularyOption { name: string; display: string; status: string; note: string; id: string }

const display = (name: string) => {
  const base = name.split(' ')[0].toLowerCase();
  if (name.startsWith('SACUBITRIL')) return 'sacubitril/valsartan';
  if (name.startsWith('NICOTINE PATCH')) return 'nicotine patch';
  if (name.startsWith('NICOTINE POLACRILEX GUM')) return 'nicotine gum';
  if (name.startsWith('NICOTINE POLACRILEX LOZENGE')) return 'nicotine lozenge';
  if (name.startsWith('METOPROLOL')) return 'metoprolol succinate';
  if (name.includes('INJ')) return base + ' (injection)';
  return base;
};

// Best status wins when the snapshot repeats a name (for example two evolocumab rows).
const statusOrder = ['Y', 'PA-N', 'PA-V', 'PA-F', 'N', 'NAP'];
export function resolveFormulary(cls: FormularyClass, drugs: { id: string; name: string; status: string; note: string }[]): FormularyOption[] {
  return formularyClasses[cls].names.map(name => {
    const rows = drugs.filter(d => d.name === name).sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
    const best = rows[0];
    return best ? { name, display: display(name), status: best.status, note: best.note || '', id: best.id } : null;
  }).filter((x): x is FormularyOption => !!x);
}

export const formularyStatusShort: Record<string, string> = {
  Y: 'Formulary', 'PA-F': 'Formulary · PA (facility)', 'PA-V': 'Formulary · PA (VISN)', 'PA-N': 'Formulary · PA (national)', N: 'Non-formulary', NAP: 'Not approved'
};
