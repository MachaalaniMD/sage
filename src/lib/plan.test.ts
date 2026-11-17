import { describe, it, expect } from 'vitest';
import { profiles, type FictionalCase } from './guidelines';
import { buildPlan } from './plan';
import { statinIntensity } from './meds';

const base = (id: string, over: Partial<FictionalCase> = {}): FictionalCase => ({ ...profiles.find(p => p.id === id)!.data, ...over });
const find = (plan: ReturnType<typeof buildPlan>, id: string) => plan.actions.find(a => a.id === id);

describe('statin intensity', () => {
  it('follows the ACC/AHA table', () => {
    expect(statinIntensity('atorvastatin', 20)).toBe('moderate');
    expect(statinIntensity('atorvastatin', 40)).toBe('high');
    expect(statinIntensity('rosuvastatin', 10)).toBe('moderate');
    expect(statinIntensity('rosuvastatin', 20)).toBe('high');
    expect(statinIntensity('simvastatin', 10)).toBe('low');
    expect(statinIntensity('none', 0)).toBe('none');
  });
});

describe('statin gap analysis', () => {
  const asc = (o: Partial<FictionalCase> = {}) => base('post-mi', { statinDrug: 'atorvastatin', statinDose: 20, ldl: 70, maxStatin: false, ...o });
  it('flags a moderate-intensity statin after ASCVD for intensification', () => {
    const a = find(buildPlan(asc(), 'general'), 'statin')!;
    expect(a.kind).toBe('change'); expect(a.title).toContain('high');
  });
  it('VA mode accepts moderate-intensity plus ezetimibe, general mode does not', () => {
    const c = asc({ ezetimibe: true });
    expect(find(buildPlan(c, 'va'), 'statin')!.kind).toBe('ok');
    expect(find(buildPlan(c, 'general'), 'statin')!.kind).toBe('change');
  });
  it('VA/DoD records lead in VA mode and follow in general mode', () => {
    const va = find(buildPlan(asc(), 'va'), 'statin')!; const gen = find(buildPlan(asc(), 'general'), 'statin')!;
    expect(va.primary.every(m => m.recommendation.sourceId.startsWith('va-'))).toBe(true);
    expect(va.alt.length).toBeGreaterThan(0);
    expect(gen.primary.some(m => m.recommendation.sourceId.startsWith('acc-'))).toBe(true);
  });
  it('starts a statin when none is entered', () => {
    expect(find(buildPlan(base('post-mi', { statinDrug: 'none' }), 'general'), 'statin')!.kind).toBe('start');
  });
  it('treats a maximally tolerated lower-intensity statin as a nonstatin add-on question', () => {
    expect(find(buildPlan(asc({ maxStatin: true }), 'general'), 'statin')!.kind).toBe('check');
  });
  it('diabetes: moderate is enough, multiple risk factors call for high intensity', () => {
    const d = base('va-visit', { statinDrug: 'atorvastatin', statinDose: 20, multipleRiskFactors: false });
    expect(find(buildPlan(d, 'general'), 'statin')!.kind).toBe('ok');
    expect(find(buildPlan({ ...d, multipleRiskFactors: true }, 'general'), 'statin')!.kind).toBe('change');
    expect(find(buildPlan({ ...d, multipleRiskFactors: true }, 'va'), 'statin')!.kind).toBe('ok');
  });
  it('escalates LDL above goal on a high-intensity statin: ezetimibe, then PCSK9 inhibitor', () => {
    const c = asc({ statinDose: 80, ldl: 85, veryHighRisk: 'yes' });
    expect(find(buildPlan(c, 'general'), 'ldl-ezetimibe')!.formulary).toEqual(['ezetimibe']);
    expect(find(buildPlan({ ...c, ezetimibe: true }, 'general'), 'ldl-pcsk9')).toBeTruthy();
    expect(find(buildPlan({ ...c, ezetimibe: true, pcsk9: true }, 'general'), 'ldl-refractory')).toBeTruthy();
  });
});

describe('other therapy gaps', () => {
  it('suggests an SGLT2 inhibitor in diabetic CKD and adds GLP-1 RA in VA mode', () => {
    const k = base('kidney', { onAceArb: true, maxAceArb: true });
    expect(find(buildPlan(k, 'general'), 'sglt2')!.kind).toBe('start');
    expect(find(buildPlan(k, 'general'), 'glp1')).toBeUndefined();
    expect(find(buildPlan(k, 'va'), 'glp1')!.kind).toBe('start');
    expect(find(buildPlan({ ...k, sglt2: true }, 'va'), 'sglt2')!.kind).toBe('ok');
  });
  it('lists missing HFrEF pillars', () => {
    const h = base('hf', { betaBlocker: true });
    const a = find(buildPlan(h, 'general'), 'hfref')!;
    expect(a.kind).toBe('start'); expect(a.detail).toContain('ARNI'); expect(a.detail).not.toContain('beta-blocker');
  });
  it('compares A1c with the VA/DoD range in VA mode and ADA otherwise', () => {
    const d = base('va-visit', { a1c: 7.8 });
    expect(find(buildPlan(d, 'va'), 'a1c')!.kind).toBe('ok');
    expect(find(buildPlan(d, 'general'), 'a1c')!.kind).toBe('check');
  });
  it('offers screening and vaccines and keeps unmapped records reachable', () => {
    const p = buildPlan(base('va-visit', { preventionContext: true }), 'va');
    expect(find(p, 'screen-crc')!.kind).toBe('offer');
    expect(find(p, 'vaccines')!.kind).toBe('offer');
    const shown = new Set([...p.actions.flatMap(a => [...a.primary, ...a.alt]), ...p.other].map(m => m.recommendation.id));
    expect(shown.size).toBeGreaterThan(5);
  });
  it('returns validation errors instead of a plan', () => {
    expect(buildPlan(base('va-visit', { sbp: 60 }), 'general').errors.length).toBeGreaterThan(0);
  });
});
