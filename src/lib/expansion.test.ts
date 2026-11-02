import {describe,it,expect} from 'vitest';
import {evaluateCase,profiles,topics,recommendations,type FictionalCase} from './guidelines';
import {documentsForDrug,searchVaDrugs,statusDefinitions,vaDrugUrl,vaSnapshot} from './va';
const run=(changes:Partial<FictionalCase>={})=>evaluateCase({...profiles[0].data,...changes});
const ids=(changes:Partial<FictionalCase>={})=>run(changes).matches.map(m=>m.recommendation.id);
describe('expanded clinical matching safeguards',()=>{
 it('represents every requested reference area with sourced records',()=>{for(const t of topics)expect(recommendations.some(r=>r.topic===t.id),t.id).toBe(true);expect(topics.length).toBe(18);});
 it('requires type and duration for diabetes-specific kidney screening',()=>{expect(ids({diabetesType:'unknown'})).not.toContain('ckd-diabetes-annual');expect(ids({diabetesType:'type1',type1Years:4})).not.toContain('ckd-diabetes-annual');expect(ids({diabetesType:'type1',type1Years:5})).toContain('ckd-diabetes-annual');});
 it('keeps unknown albuminuria unknown',()=>{const r=run({ckd:true,diabetesType:'unknown',uacr:null});expect(r.matches.map(m=>m.recommendation.id)).not.toContain('ckd-va-finerenone');expect(r.gaps.some(g=>g.includes('UACR is absent'))).toBe(true);});
 it('checks SGLT2 kidney threshold inclusively',()=>{expect(ids({ckd:true,egfr:20})).toContain('ckd-kdigo-sglt2');expect(ids({ckd:true,egfr:19})).not.toContain('ckd-kdigo-sglt2');});
 it('checks VA finerenone potassium, UACR, eGFR and current therapy',()=>{
  const c={ckd:true,uacr:31,albuminuriaPersistent:true,egfr:25,potassium:4.7,onAceArb:true,maxAceArb:true};
  expect(ids(c)).toContain('ckd-va-finerenone');
  for(const change of [{uacr:30},{potassium:4.8},{egfr:24},{onAceArb:false},{maxAceArb:false},{albuminuriaPersistent:false}])expect(ids({...c,...change})).not.toContain('ckd-va-finerenone');
 });
 it('distinguishes persistent albuminuria referral from an isolated result',()=>{expect(ids({ckd:true,egfr:30,uacr:701,albuminuriaPersistent:false})).not.toContain('referral-kidney');expect(ids({ckd:true,egfr:30,uacr:701,albuminuriaPersistent:true})).toContain('referral-kidney');expect(ids({ckd:true,egfr:29,uacr:null})).toContain('referral-kidney');});
 it('requires routine-screening context and preserves CRC grades at age boundaries',()=>{expect(ids({age:45,preventionContext:false})).not.toContain('screen-crc-45-49');expect(ids({age:45,preventionContext:true})).toContain('screen-crc-45-49');expect(ids({age:50,preventionContext:true})).toContain('screen-crc-50-75');});
 it('does not infer cervical or breast-screening eligibility from sex',()=>{expect(ids({sex:'female',preventionContext:true,cervix:false,routineBreastScreening:false})).not.toEqual(expect.arrayContaining(['screen-cervical-final','screen-breast-40-74']));expect(ids({cervix:true,preventionContext:true})).toContain('screen-cervical-final');expect(ids({cervix:true,preventionContext:true,immunocompromised:true})).not.toContain('screen-cervical-final');});
 it('requires lung-treatment candidacy, exposure and quit interval',()=>{const c={age:60,preventionContext:true,packYears:20,smoker:false,yearsSinceQuit:14.9,lungTreatmentCandidate:true};expect(ids(c)).toContain('screen-lung-ldct');for(const change of [{packYears:19.9},{yearsSinceQuit:15},{lungTreatmentCandidate:false}])expect(ids({...c,...change})).not.toContain('screen-lung-ldct');});
 it('does not infer an ACEi/ARB from generic BP medication use',()=>{expect(ids({bpTreatment:true,onAceArb:false})).not.toContain('monitor-ace-arb');expect(ids({onAceArb:true})).toContain('monitor-ace-arb');});
 it('preserves obesity references when BMI is outside PREVENT range',()=>{const r=run({bmi:40});expect(r.errors).toEqual([]);expect(r.risk?.tenYear).toBeNull();expect(r.matches.map(m=>m.recommendation.id)).toContain('obesity-pharmacotherapy');});
 it('does not turn a benzodiazepine reference into an abrupt-stop recommendation',()=>{expect(ids({age:65,onBenzodiazepine:true})).toContain('deprescribe-bzd-withdrawal');expect(ids({onBenzodiazepine:false})).not.toContain('deprescribe-bzd-withdrawal');});
});
describe('VA source snapshot and indication-specific access',()=>{
 it('preserves all source rows and checksums with unique UI keys',()=>{expect(vaSnapshot.drugs.length).toBe(vaSnapshot.metadata.sourceRows);expect(new Set(vaSnapshot.drugs.map(d=>d.key)).size).toBe(vaSnapshot.drugs.length);for(const h of Object.values(vaSnapshot.metadata.sha256))expect(h).toMatch(/^[a-f0-9]{64}$/);});
 it('distinguishes Ozempic and Wegovy even with the same ingredient name',()=>{const rows=searchVaDrugs('semaglutide');expect(rows.find(d=>d.synonyms==='OZEMPIC')?.status).toBe('PA-F');expect(rows.find(d=>d.synonyms.includes('WEGOVY')&&d.name==='SEMAGLUTIDE INJ,SOLN')?.status).toBe('N');});
 it('retains drug-specific current CFU links and revisions',()=>{const d=vaSnapshot.drugs.find(d=>d.synonyms==='OZEMPIC')!;expect(documentsForDrug(d).some(doc=>doc.type==='CFU'&&doc.revision==='2026-04')).toBe(true);});
 it('filters by source status without changing its meaning',()=>{const found=searchVaDrugs('apixaban','PA-F');expect(found.length).toBeGreaterThan(0);expect(found.every(d=>d.status==='PA-F')).toBe(true);});
 it('keeps all links on the official VA HTTPS origin and interprets every flag',()=>{for(const d of vaSnapshot.drugs){expect(statusDefinitions[d.status]).toBeDefined();expect(new URL(vaDrugUrl(d)).origin).toBe('https://www.va.gov');}for(const doc of vaSnapshot.documents)expect(new URL(doc.url).origin).toBe('https://www.va.gov');});
});
