import {describe,it,expect} from 'vitest';
import {evaluateCase,profiles,heartFailurePhenotype,recommendations,recommendationClass,filterEvidence,preservedDoses,sources,cardiacTopics,type FictionalCase} from './guidelines';

const reduced=profiles.find(p=>p.id==='hf')!.data;
const preserved=profiles.find(p=>p.id==='hfpef')!.data;
const run=(changes:Partial<FictionalCase>={},base=preserved)=>evaluateCase({...base,...changes});
const ids=(changes:Partial<FictionalCase>={},base=preserved)=>run(changes,base).matches.map(m=>m.recommendation.id);
describe('HF phenotype and eligibility',()=>{
 it.each([[40,'hfref'],[41,'hfmref'],[49,'hfmref'],[50,'hfpef']])('classifies EF %i with confirmed context as %s',(ef,type)=>expect(heartFailurePhenotype({...preserved,ef:Number(ef)})).toBe(type));
 it('does not infer HF from EF alone',()=>expect(heartFailurePhenotype({...preserved,hf:false})).toBe('none'));
 it.each([{hfEfHistory:'unknown' as const},{hfFillingPressureEvidence:false}])('withholds HFpEF-specific matches with incomplete context %j',change=>{
  expect(heartFailurePhenotype({...preserved,...change})).toBe('unclassified');
  expect(ids(change).filter(id=>id.startsWith('hfpef-'))).toEqual([]);
  expect(run(change).gaps.some(g=>g.includes('EF alone'))).toBe(true);
 });
 it.each([41,50,60])('prior reduced EF now %i gets continued GDMT rather than a preserved-EF label',ef=>{
  const c={ef,hfEfHistory:'previously-reduced' as const,nyha:'I' as const,hfFillingPressureEvidence:false};
  expect(heartFailurePhenotype({...preserved,...c})).toBe('hfimpef');
  expect(ids(c)).toContain('hfimp-continue');
  expect(ids(c).filter(id=>id.startsWith('hfpef-'))).toEqual([]);
 });
 it('shows both dated HFpEF SGLT2 references without requiring diabetes',()=>{
  expect(ids({diabetes:false})).toEqual(expect.arrayContaining(['hfpef-sglt2','hfpef-acc2026-sglt2']));
  for(const id of ['hf-arni','hf-beta','hf-mra','hf-sglt2'])expect(ids()).not.toContain(id);
 });
 it.each([{egfr:19},{dialysis:true},{nyha:'I' as const}])('withholds initiation references outside encoded SGLT2 context %j',change=>expect(ids(change)).not.toContain('hfpef-sglt2'));
 it('keeps drug-specific renal review at the lower class threshold',()=>{
  const r=run({egfr:20}).matches.find(m=>m.recommendation.id==='hfpef-sglt2');
  expect(r).toBeDefined();expect(r!.context).toContain('does not establish dapagliflozin');
 });
 it('uses explicit hypertension and AF context',()=>{
  expect(ids({hypertensionDiagnosis:false,afKnown:false})).not.toEqual(expect.arrayContaining(['hfpef-bp','hfpef-af']));
  expect(ids({hypertensionDiagnosis:true,afKnown:true})).toEqual(expect.arrayContaining(['hfpef-bp','hfpef-af']));
 });
 it('requires a congestion flag for the all-EF diuretic reference',()=>{
  expect(ids({hfVolumeOverload:false})).not.toContain('hf-diuretic');
  expect(ids({hfVolumeOverload:true})).toContain('hf-diuretic');
  expect(ids({hfVolumeOverload:true},reduced)).toContain('hf-diuretic');
 });
 it('gates the finerenone HF label at eGFR 25 and potassium 5.0 inclusively',()=>{
  expect(ids({egfr:25,potassium:5})).toContain('hfpef-acc2026-finerenone');
  for(const c of [{egfr:24.9},{potassium:5.1},{onMra:true},{dialysis:true}])expect(ids(c)).not.toContain('hfpef-acc2026-finerenone');
 });
 it('does not automatically select conditional 2022 add-ons',()=>{
  for(const id of ['hfpef-mra','hfpef-arb','hfpef-arni'])expect(ids()).not.toContain(id);
  expect(ids({hfSelectedAddOnReviewed:true})).toEqual(expect.arrayContaining(['hfpef-mra','hfpef-arb','hfpef-arni']));
  for(const c of [{egfr:30},{potassium:5},{onMra:true},{dialysis:true}])expect(ids({...c,hfSelectedAddOnReviewed:true})).not.toContain('hfpef-mra');
 });
 it('keeps mildly reduced guidance separate from preserved and reduced pillars',()=>{
  expect(ids({ef:45,hfSelectedAddOnReviewed:true})).toEqual(expect.arrayContaining(['hfmr-sglt2','hfmr-selected']));
  expect(ids({ef:45}).filter(id=>id.startsWith('hfpef-')||id==='hf-arni')).toEqual([]);
 });
 it('retains the four HFrEF pillars and does not automatically select additional therapies',()=>{
  expect(ids({},reduced)).toEqual(expect.arrayContaining(['hf-arni','hf-beta','hf-mra','hf-sglt2']));
  for(const id of ['hf-ivabradine','hf-digoxin','hf-vericiguat'])expect(ids({},reduced)).not.toContain(id);
 });
});
describe('original cardiac grades and dose provenance',()=>{
 it('keeps original 2022 HFpEF classes and evidence levels',()=>{
  for(const [id,strength,level] of [['hfpef-sglt2','Class 2a','B-R'],['hfpef-af','Class 2a','C-EO'],['hfpef-bp','Class 1','C-LD'],['hfpef-arni','Class 2b','B-R'],['hfpef-nitrates','Class 3: No Benefit','B-R']]){
   const r=recommendations.find(r=>r.id===id)!;expect(r.strength).toBe(strength);expect(r.evidenceLevel).toBe(level);
  }
 });
 it('never assigns formal COR / LOE to the 2026 ACC consensus',()=>{
  const rows=recommendations.filter(r=>r.sourceId==='acc-hfpef-2026');expect(rows.length).toBe(2);
  expect(rows.every(r=>r.evidenceLevel===null&&recommendationClass(r)==='ungraded')).toBe(true);
 });
 it('retains ESC grades separately and normalizes only the filter category',()=>{
  const r=recommendations.find(r=>r.id==='hfpef-esc2026-ras')!;
  expect(r.strength).toBe('Class IIb');expect(r.gradeSystem).toBe('ESC COR / LOE');expect(r.evidenceLevel).toBe('C');expect(recommendationClass(r)).toBe('2b');
 });
 it('combines independent class, evidence and HF phenotype filters',()=>{
  const hits=filterEvidence(recommendations,'2a','C-EO','hfpef');expect(hits.map(r=>r.id)).toEqual(['hfpef-af']);
  expect(filterEvidence(recommendations,'3-harm').map(r=>r.id)).toContain('hf-nsaid-harm');
  expect(filterEvidence(recommendations,'3-no-benefit').map(r=>r.id)).toContain('hfpef-nitrates');
  expect(filterEvidence(recommendations,'3-no-benefit').map(r=>r.id)).not.toContain('hf-nsaid-harm');
 });
 it('has non-A evidence and conditional / negative advice across the cardiac collection',()=>{
  const rows=recommendations.filter(r=>cardiacTopics.includes(r.topic));
  for(const value of ['2a','2b','3-no-benefit','3-harm'] as const)expect(filterEvidence(rows,value).length).toBeGreaterThan(0);
  expect(rows.some(r=>r.evidenceLevel==='B-NR')).toBe(true);expect(rows.some(r=>r.evidenceLevel==='C-LD')).toBe(true);
 });
 it('does not conflate post-MI reassessment with the no-prior-MI no-benefit population',()=>{
  const review=recommendations.find(r=>r.id==='ccd-beta-review')!;const none=recommendations.find(r=>r.id==='ccd-beta-no-benefit')!;
  expect(review.strength).toBe('Class 2b');expect(none.population).toContain('without prior MI');expect(none.strength).toBe('Class 3: No Benefit');
 });
 it('keeps HFpEF doses sourced separately and uses the HF finerenone targets',()=>{
  expect(preservedDoses).toHaveLength(4);
  for(const d of preservedDoses){expect(sources.find(s=>s.id===d.sourceId)).toBeDefined();expect(d.locator.length).toBeGreaterThan(8);}
  const f=preservedDoses.filter(d=>d.sourceId==='fda-finerenone-hf');
  expect(f.map(d=>[d.start,d.target])).toEqual([['20 mg once daily','40 mg once daily'],['10 mg once daily','20 mg once daily']]);
  expect(sources.find(s=>s.id==='fda-finerenone-hf')!.year).toBe(2025);
 });
});
