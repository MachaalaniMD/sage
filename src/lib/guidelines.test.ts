import { describe, expect, it } from 'vitest';
import { doses, evaluateCase, profiles, recommendations, searchRecommendations, sources, validateCase, versions, type FictionalCase } from './guidelines';
import published from '../data/prevent-coefficients.json';

const run = (overrides: Partial<FictionalCase> = {}, profile = 'diabetes') => evaluateCase({ ...profiles.find(p => p.id === profile)!.data, ...overrides });
const ids = (overrides: Partial<FictionalCase> = {}, profile = 'diabetes') => run(overrides, profile).matches.map(m => m.recommendation.id);
describe('secondary prevention and risk calculator integration', () => {
  it('shows post-MI goals, add-on therapy and CCD aspirin without first-event scores', () => {
    const result = run({}, 'post-mi');
    expect(result.risk?.tenYear).toBeNull();
    expect(ids({}, 'post-mi')).toEqual(expect.arrayContaining(['secondary-lipids-very-high','secondary-lipids-add-on','secondary-va-lipids','secondary-aspirin','secondary-bp-systolic','secondary-bp-diastolic']));
    expect(ids({}, 'post-mi')).not.toContain('prevention-aspirin');
  });
  it('treats prior MI as ASCVD even if the separate ASCVD box is unchecked', () => {
    expect(ids({ascvd:false}, 'post-mi')).toContain('secondary-lipids-very-high');
    expect(ids({ascvd:false}, 'post-mi')).not.toContain('lipids-diabetes');
    expect(run({ascvd:false}, 'post-mi').risk?.tenYear).toBeNull();
  });
  it('does not infer very-high-risk status from a single MI', () => {
    const result=run({veryHighRisk:'unknown'}, 'post-mi');
    expect(result.matches.filter(m=>m.recommendation.id.startsWith('secondary-lipids'))).toHaveLength(0);
    expect(result.gaps.some(g=>g.includes('Figure 10'))).toBe(true);
    expect(ids({veryHighRisk:'no'}, 'post-mi')).toContain('secondary-lipids-standard');
    expect(ids({veryHighRisk:'no'}, 'post-mi')).not.toContain('secondary-lipids-very-high');
  });
  it('requires maximally tolerated statin context and the inclusive LDL threshold for the add-on reference', () => {
    expect(ids({ldl:55}, 'post-mi')).toContain('secondary-lipids-add-on');
    for(const change of [{ldl:54},{maxStatin:false},{statin:false}]) expect(ids(change,'post-mi')).not.toContain('secondary-lipids-add-on');
  });
  it('distinguishes first-year ACS from chronic coronary antiplatelet references at 12 months', () => {
    expect(ids({miMonthsAgo:11},'post-mi')).toEqual(expect.arrayContaining(['secondary-dapt','secondary-rehab']));
    expect(ids({miMonthsAgo:11},'post-mi')).not.toContain('secondary-aspirin');
    expect(ids({miMonthsAgo:12},'post-mi')).toContain('secondary-aspirin');
    expect(ids({miMonthsAgo:12},'post-mi')).not.toContain('secondary-dapt');
  });
  it.each([{bleedingRisk:'unknown' as const},{bleedingRisk:'high' as const},{oralAnticoagulation:true},{antiplateletContraindication:true}])('withholds default antiplatelet pathways for %j', change => {
    expect(ids(change,'post-mi')).not.toContain('secondary-aspirin');
    expect(ids({...change,miMonthsAgo:2},'post-mi')).not.toContain('secondary-dapt');
  });
  it('does not apply coronary aspirin solely from a generic ASCVD history', () => expect(ids({priorMi:false},'post-mi')).not.toContain('secondary-aspirin'));
  it('keeps VA/DoD secondary scope exclusions explicit', () => {
    for(const change of [{veteran:false},{hf:true,ef:35},{dialysis:true},{egfr:14}]) expect(ids(change,'post-mi')).not.toContain('secondary-va-lipids');
  });
  it('uses total CVD for BP and ASCVD for lipids from the same inputs', () => {
    const result=run({...published.fixtureInputs,sex:'female',age:60,diabetes:false,ckd:false,veteran:false,ldl:115,dbp:82});
    expect(result.risk!.tenYear!.cvd).toBeGreaterThanOrEqual(.075);
    expect(result.risk!.tenYear!.ascvd).toBeLessThan(.10);
    const found=result.matches.map(m=>m.recommendation.id);
    expect(found).toContain('htn-diabetes');
    expect(found).toContain('lipids-prevent-intermediate');
    expect(found).not.toContain('lipids-prevent-high');
  });
  it('withholds risk-based matches for invalid model input, but preserves independent diabetes guidance', () => {
    const result=run({totalCholesterol:NaN});
    expect(result.errors).toEqual([]);
    expect(result.risk?.errors.length).toBeGreaterThan(0);
    expect(result.matches.map(m=>m.recommendation.id)).toContain('lipids-diabetes');
    expect(result.matches.map(m=>m.recommendation.id)).not.toContain('lipids-prevent-high');
  });
  it('withholds the general risk lipid pathway for known subclinical disease', () => expect(ids({diabetes:false,subclinicalAtherosclerosis:true,age:65,smoker:true,sbp:160})).not.toContain('lipids-prevent-high'));
});
describe('diabetes and primary prevention boundaries', () => {
  it.each([40, 47, 75])('matches ACC diabetes statin at age %i', age => expect(ids({ age })).toContain('lipids-diabetes'));
  it.each([39, 76])('withholds the 40–75 ACC pathway at age %i', age => expect(ids({ age })).not.toContain('lipids-diabetes'));
  it('shows the baseline goal for age 47, diabetes, LDL 115', () => {
    const match = run().matches.find(m => m.recommendation.id === 'lipids-diabetes')!;
    expect(match.recommendation.summary).toContain('<100 mg/dL');
    expect(match.recommendation.strength).toBe('Class 1');
    expect(match.recommendation.evidenceLevel).toBe('A');
    expect(match.reason).toContain('Age 40–75');
  });
  it('uses the higher-risk pathway only with explicit additional context', () => {
    expect(ids()).not.toContain('lipids-diabetes-high-risk');
    expect(ids({ multipleRiskFactors: true })).toContain('lipids-diabetes-high-risk');
    expect(ids({ multipleRiskFactors: true })).not.toContain('lipids-diabetes');
  });
  it('does not match a primary prevention statin or aspirin with known ASCVD', () => {
    const result = run({ ascvd: true, age: 64 });
    expect(result.matches.map(m => m.recommendation.id)).not.toEqual(expect.arrayContaining(['lipids-diabetes', 'va-lipids-primary', 'prevention-aspirin']));
    expect(result.matches.filter(m => ['lipids-diabetes','va-lipids-primary','prevention-aspirin'].includes(m.recommendation.id))).toHaveLength(0);
    expect(result.gaps.some(g => g.includes('Secondary prevention is shown separately'))).toBe(true);
  });
  it('keeps VA context explicit and respects the HFrEF scope exclusion', () => {
    expect(ids({ veteran: false })).not.toContain('va-lipids-primary');
    expect(ids({ hf: true, ef: 35 })).not.toContain('va-lipids-primary');
    expect(ids({ hf: true, ef: 36 })).toContain('va-lipids-primary');
  });
  it('uses VA LDL threshold inclusively and does not infer missing risk scores', () => {
    expect(ids({ diabetes: false, ldl: 190 })).toContain('va-lipids-primary');
    expect(ids({ diabetes: false, ldl: 189 })).not.toContain('va-lipids-primary');
    expect(ids({ egfr: 14 })).not.toContain('va-lipids-primary');
  });
});
describe('vaccination history', () => {
  it('finds the age-58 routine vaccination references', () => expect(ids({}, 'vaccines')).toEqual(expect.arrayContaining(['vax-influenza','vax-zoster','vax-pneumococcal','vax-hepb'])));
  it('does not recommend repeating a documented completed series', () => {
    expect(run({ influenza: 'complete', zoster: 'complete', pneumococcal: 'complete', hepb: 'complete' }, 'vaccines').matches.filter(m => m.recommendation.topic === 'vaccinations')).toHaveLength(0);
  });
  it('defers partial pneumococcal and RZV histories', () => {
    const result = run({ zoster: 'partial', pneumococcal: 'partial' }, 'vaccines');
    expect(result.matches.map(m => m.recommendation.id)).not.toContain('vax-zoster');
    expect(result.matches.map(m => m.recommendation.id)).not.toContain('vax-pneumococcal');
    expect(result.gaps.some(g => g.includes('dose dates'))).toBe(true);
    expect(result.gaps.some(g => g.includes('product and date'))).toBe(true);
  });
  it('does not extend an age-based routine pathway below its encoded age', () => {
    expect(ids({ age: 49 }, 'vaccines')).not.toContain('vax-pneumococcal');
    expect(ids({ age: 49 }, 'vaccines')).not.toContain('vax-zoster');
    expect(ids({ age: 50 }, 'vaccines')).toContain('vax-pneumococcal');
    expect(ids({ age: 60 }, 'vaccines')).not.toContain('vax-hepb');
  });
  it('does not silently apply routine RZV guidance to immunocompromised cases', () => {
    expect(ids({ immunocompromised: true }, 'vaccines')).not.toContain('vax-zoster');
    expect(run({ immunocompromised: true }, 'vaccines').gaps.some(g => g.includes('Immunocompromised'))).toBe(true);
  });
});
describe('HFrEF eligibility boundaries', () => {
  it('matches all four pillars for the stable fictional HFrEF example', () => expect(ids({}, 'hf')).toEqual(expect.arrayContaining(['hf-arni','hf-beta','hf-mra','hf-sglt2'])));
  it.each([30, 29])('withholds MRA when eGFR is %i', egfr => expect(ids({ egfr }, 'hf')).not.toContain('hf-mra'));
  it('permits the MRA reference just above the renal threshold', () => expect(ids({ egfr: 31 }, 'hf')).toContain('hf-mra'));
  it.each([5, 5.1])('withholds MRA at potassium %f', potassium => expect(ids({ potassium }, 'hf')).not.toContain('hf-mra'));
  it('permits MRA below the potassium boundary', () => expect(ids({ potassium: 4.9 }, 'hf')).toContain('hf-mra'));
  it('limits ARNI to the encoded NYHA II–III population', () => {
    expect(ids({ nyha: 'IV' }, 'hf')).not.toContain('hf-arni');
    expect(ids({ nyha: 'III' }, 'hf')).toContain('hf-arni');
  });
  it('does not apply symptomatic pathways at NYHA I', () => {
    expect(ids({ nyha: 'I' }, 'hf')).not.toContain('hf-mra');
    expect(ids({ nyha: 'I' }, 'hf')).not.toContain('hf-sglt2');
    expect(ids({ nyha: 'I' }, 'hf')).toContain('hf-beta');
  });
  it('does not treat HFpEF as HFrEF', () => expect(run({ ef: 50 }, 'hf').matches.filter(m => m.recommendation.topic === 'heart-failure')).toHaveLength(0));
  it('does not require diabetes for an SGLT2 HFrEF reference', () => expect(ids({ diabetes: false }, 'hf')).toContain('hf-sglt2'));
});
describe('blood pressure and prevention', () => {
  it('handles systolic and diastolic thresholds independently', () => {
    expect(ids({ diabetes: false, sbp: 139, dbp: 89 })).not.toContain('htn-treatment');
    expect(ids({ diabetes: false, sbp: 140, dbp: 89 })).toContain('htn-treatment');
    expect(ids({ diabetes: false, sbp: 139, dbp: 90 })).toContain('htn-treatment');
  });
  it('does not combine the systolic evidence grade with a diastolic-only match', () => {
    expect(ids({ sbp: 129, dbp: 81 })).not.toContain('htn-diabetes');
    expect(ids({ sbp: 130, dbp: 81 })).toContain('htn-diabetes');
  });
  it('flags severe fictional readings as outside triage coverage', () => expect(run({ sbp: 181 }).gaps.some(g => g.includes('Severely elevated'))).toBe(true));
  it('limits aspirin to primary-prevention initiation at 60 and above', () => {
    expect(ids({ age: 59 })).not.toContain('prevention-aspirin');
    expect(ids({ age: 60 })).toContain('prevention-aspirin');
    expect(ids({ age: 62, ascvd: true })).not.toContain('prevention-aspirin');
  });
  it('does not equate insufficient evidence in men with advice against screening', () => {
    const match = run({ age: 62, sex: 'male' }).matches.find(m => m.recommendation.id === 'prevention-osteoporosis-men')!;
    expect(match.recommendation.strength).toBe('I statement');
    expect(match.context).toContain('not a recommendation against');
  });
  it('requires age 65 for the encoded women’s screening rule and excludes existing disease', () => {
    expect(ids({ age: 64, sex: 'female' })).not.toContain('prevention-osteoporosis');
    expect(ids({ age: 65, sex: 'female' })).toContain('prevention-osteoporosis');
    expect(ids({ age: 65, sex: 'female', secondaryBoneDisease: true })).not.toContain('prevention-osteoporosis');
  });
});
describe('invalid input and explicit uncertainty', () => {
  it.each([{ age: NaN }, { age: 18 }, { age: 47.5 }, { sbp: 70, dbp: 80 }, { egfr: -1 }, { potassium: Infinity }])('returns no matches for invalid numeric input %j', overrides => {
    const result = run(overrides);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.matches).toHaveLength(0);
  });
  it.each(profiles)('validates the fictional $name example', p => expect(validateCase(p.data)).toEqual([]));
  it('always reports limited coverage and pending clinical review', () => {
    for (const p of profiles) {
      const result = evaluateCase(p.data);
      expect(result.gaps.some(g => g.includes('missing match does not mean'))).toBe(true);
      expect(result.gaps.some(g => g.includes('independent medical verification'))).toBe(true);
      expect(result.matches.every(m => m.reason.length > 0 && m.recommendation.status === 'pending-medical-review')).toBe(true);
    }
  });
});
describe('data provenance and library search', () => {
  it('requires valid unique source IDs, locators, versions and explicit review status for every record', () => {
    expect(new Set(recommendations.map(r => r.id)).size).toBe(recommendations.length);
    expect(new Set(recommendations.map(r => r.rule)).size).toBe(recommendations.length);
    for (const r of recommendations) {
      const source = sources.find(s => s.id === r.sourceId);
      expect(source, r.id).toBeDefined(); expect(r.locator.length).toBeGreaterThan(8);
      expect(r.population.length).toBeGreaterThan(10); expect(r.status).toBe('pending-medical-review');
      expect(r.revision).toBeGreaterThan(0); expect(r.evidenceNote).toBeTruthy();
      expect(source!.year).toBeLessThanOrEqual(2026); expect(['2026-11-01','2026-11-02']).toContain(source!.checkedAt);
      const url = new URL(source!.url); expect(url.protocol).toBe('https:');
      expect(['www.cdc.gov','www.ahajournals.org','healthquality.va.gov','www.healthquality.va.gov','www.heart.org','www.uspreventiveservicestaskforce.org','pmc.ncbi.nlm.nih.gov','diabetesjournals.org','doi.org','kdigo.org','www.asge.org','asmbs.org','journal.chestnet.org','gastro.org','downloads.asam.org','professional.heart.org','tools.acc.org','acsjournals.onlinelibrary.wiley.com','www.jacc.org','academic.oup.com','www.accessdata.fda.gov','www.dailymed.nlm.nih.gov']).toContain(url.hostname);
    }
  });
  it('does not invent an ACC evidence grade for other grading systems', () => {
    expect(recommendations.filter(r => !['ACC/AHA COR / LOE','ESC COR / LOE'].includes(r.gradeSystem)).every(r => r.evidenceLevel === null)).toBe(true);
  });
  it('keeps all dose references traceable to Table 14, without separate invented dose grades', () => {
    expect(doses).toHaveLength(8);
    for (const d of doses) { expect(sources.find(s => s.id === d.sourceId)).toBeDefined(); expect(d.locator).toContain('Table 14'); expect(d.start).toContain('mg'); expect(d.target).toContain('mg'); }
  });
  it('keeps version comparisons unapproved and links their update summaries', () => {
    for (const v of versions) { expect(v.status).toBe('pending-medical-review'); expect(v.changes.length).toBeGreaterThan(0); expect(Number(v.current)).toBeGreaterThan(Number(v.previous)); expect(new URL(v.url).protocol).toBe('https:'); }
  });
  it('finds statins and medication names; handles no results', () => {
    expect(searchRecommendations('statin').map(r => r.id)).toEqual(expect.arrayContaining(['lipids-diabetes','va-lipids-primary']));
    expect(searchRecommendations('dapagliflozin').map(r => r.id)).toContain('hf-sglt2');
    expect(searchRecommendations('statn').map(r => r.id)).toContain('lipids-diabetes');
    expect(searchRecommendations('zxqvnomatch')).toEqual([]);
  });
  it('combines topic and society filters', () => {
    const results = searchRecommendations('', 'hypertension', 'VA');
    expect(results.map(r => r.id)).toEqual(expect.arrayContaining(['va-htn-target','htn-va-diastolic-goal']));
    expect(results.every(r=>r.sourceId==='va-htn-2026')).toBe(true);
    expect(searchRecommendations('', 'heart-failure', 'CDC')).toEqual([]);
  });
});
