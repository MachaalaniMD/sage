import sourceData from '../data/sources.json';
import chronicSources from '../data/chronic-sources.json';
import preventionSources from '../data/prevention-sources.json';
import medicationSources from '../data/medication-sources.json';
import cardiacSources from '../data/cardiac-sources.json';
import cardiacData from '../data/cardiac-expansion.json';
import preservedDoseData from '../data/hfpef-doses.json';
import chronicData from '../data/chronic-expansion.json';
import preventionData from '../data/prevention-expansion.json';
import medicationData from '../data/medication-expansion.json';
import riskData from '../data/risk-expansion.json';
import recommendationData from '../data/recommendations.json';
import additionalData from '../data/additional-recommendations.json';
import doseData from '../data/doses.json';
import versionData from '../data/versions.json';
import Fuse from 'fuse.js';
import { calculatePrevent, displayRisk, type PreventInputs, type PreventResult } from './prevent';

export type Topic = 'vaccinations' | 'dyslipidemia' | 'hypertension' | 'heart-failure' | 'prevention' | 'secondary-prevention' | 'screening' | 'diabetes' | 'ckd' | 'anticoagulation' | 'osteoporosis' | 'obesity' | 'infectious-disease' | 'cancer-surveillance' | 'monitoring' | 'deprescribing' | 'referral' | 'lifestyle';
export type Source = { id:string;society:string;title:string;year:number;version:string;url:string;checkedAt:string;access:string;topic:string };
export type HfPhenotype = 'hfref' | 'hfmref' | 'hfpef' | 'hfimpef';
export type Recommendation = Omit<(typeof recommendationData)[number], 'topic'> & { topic: Topic; hfPhenotypes?: HfPhenotype[] };
export const sources = [...sourceData,...chronicSources,...preventionSources,...medicationSources,...cardiacSources];
export const recommendations = [...recommendationData.map(r=>r.id.startsWith('prevention-osteoporosis')?{...r,topic:'osteoporosis'}:r.topic==='heart-failure'?{...r,hfPhenotypes:['hfref']}:r), ...additionalData,...chronicData,...preventionData,...medicationData,...riskData,...cardiacData] as Recommendation[];
export const doses = doseData;
export const preservedDoses = preservedDoseData;
export const versions = versionData;
export const sourceFor = (r: Recommendation) => sources.find(s => s.id === r.sourceId)!;
export const topics: { id: Topic; title: string; short: string; description: string; society: string; color: string }[] = [
  { id: 'vaccinations', title: 'Adult vaccinations', short: 'Vaccinations', description: 'Age, history, and risk-based immunization guidance.', society: 'CDC / ACIP', color: 'sage' },
  { id: 'dyslipidemia', title: 'Dyslipidemia', short: 'Dyslipidemia', description: 'Statin eligibility, intensity, and LDL-C goals.', society: 'ACC / AHA · VA / DoD', color: 'blue' },
  { id: 'hypertension', title: 'Hypertension', short: 'Hypertension', description: 'Treatment thresholds and blood pressure goals.', society: 'ACC / AHA · VA / DoD', color: 'ochre' },
  { id: 'heart-failure', title: 'Heart failure', short: 'Heart failure', description: 'HFrEF, HFpEF, mildly reduced and improved EF: therapy, eligibility and doses.', society: 'AHA / ACC / HFSA · ACC · ESC', color: 'rose' },
  { id: 'prevention', title: 'Primary prevention', short: 'Primary prevention', description: 'Selected aspirin initiation recommendations.', society: 'USPSTF', color: 'sage' },
  { id: 'secondary-prevention', title: 'Secondary prevention', short: 'Secondary prevention', description: 'After MI or ASCVD: lipid goals, antiplatelets, BP, and rehabilitation.', society: 'ACC / AHA · VA / DoD', color: 'rose' },
  {"id": "screening", "title": "Preventive screening", "short": "Screening", "description": "Cancer screening, AAA, and selected USPSTF preventive care.", "society": "USPSTF", "color": "blue"},
  {"id": "diabetes", "title": "Diabetes targets", "short": "Diabetes", "description": "Individualized A1c targets and eye, foot, and lab screening intervals.", "society": "ADA · VA / DoD", "color": "sage"},
  {"id": "ckd", "title": "CKD recommendations", "short": "CKD", "description": "Albuminuria, kidney-protective therapy, monitoring, and referral.", "society": "KDIGO · ADA · VA / DoD", "color": "blue"},
  {"id": "anticoagulation", "title": "Anticoagulation", "short": "Anticoagulation", "description": "AF and VTE indications, duration, and elective procedure guidance.", "society": "ACC / AHA · ASH · CHEST", "color": "rose"},
  {"id": "osteoporosis", "title": "Osteoporosis", "short": "Osteoporosis", "description": "DXA screening, fracture history, FRAX thresholds, and treatment.", "society": "USPSTF · BHOF", "color": "ochre"},
  {"id": "obesity", "title": "Obesity", "short": "Obesity", "description": "Medication and metabolic surgery eligibility, by society.", "society": "ACP · ASMBS / IFSO", "color": "sage"},
  {"id": "infectious-disease", "title": "Infectious disease screening", "short": "Infection screening", "description": "HIV, HCV, HBV, TB, and risk-based STI screening.", "society": "CDC · USPSTF", "color": "blue"},
  {"id": "cancer-surveillance", "title": "Cancer surveillance", "short": "Cancer surveillance", "description": "Selected post-polyp, colorectal cancer, and cervical follow-up.", "society": "USMSTF · ASCCP", "color": "rose"},
  {"id": "monitoring", "title": "Medication monitoring", "short": "Drug monitoring", "description": "Selected laboratory checks after starting or changing therapy.", "society": "ACC / AHA · KDIGO · ADA", "color": "ochre"},
  {"id": "deprescribing", "title": "Deprescribing", "short": "Deprescribing", "description": "Review indications, benefit, harm, and safe tapering principles.", "society": "AGA · ASAM", "color": "sage"},
  {"id": "referral", "title": "Specialist referral", "short": "Referral criteria", "description": "Kidney and liver thresholds that prompt specialist assessment.", "society": "KDIGO · ACC / AHA", "color": "blue"},
  {"id": "lifestyle", "title": "Lifestyle recommendations", "short": "Lifestyle", "description": "Physical activity, nutrition, tobacco, and alcohol counseling.", "society": "HHS · AHA · USPSTF", "color": "sage"}
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
export const cardiacTopics: Topic[] = ['heart-failure','dyslipidemia','hypertension','secondary-prevention','anticoagulation'];
export type ClassFilter = 'all'|'1'|'2a'|'2b'|'3-no-benefit'|'3-harm'|'ungraded';
export function recommendationClass(r: Recommendation): Exclude<ClassFilter,'all'> {
  const strength=r.strength.toLowerCase();
  if(!r.gradeSystem.includes('COR / LOE'))return 'ungraded';
  if(strength.includes('harm'))return '3-harm';
  if(strength.includes('no benefit'))return '3-no-benefit';
  if(/^class (2a|iia)$/.test(strength))return '2a';
  if(/^class (2b|iib)$/.test(strength))return '2b';
  if(/^class (1|i)$/.test(strength))return '1';
  return 'ungraded';
}
export function filterEvidence(rows: Recommendation[], strength:ClassFilter='all', evidence='all', phenotype:HfPhenotype|'all'='all') {
  return rows.filter(r=>(strength==='all'||recommendationClass(r)===strength)&&(evidence==='all'||(r.evidenceLevel||'ungraded')===evidence)&&(phenotype==='all'||r.hfPhenotypes?.includes(phenotype)));
}
export interface FictionalCase extends PreventInputs {
  age: number; sex: 'female' | 'male'; diabetes: boolean; ckd: boolean;
  veteran: boolean; ascvd: boolean; multipleRiskFactors: boolean;
  sbp: number; dbp: number; ldl: number;
  hf: boolean; ef: number; nyha: 'I' | 'II' | 'III' | 'IV'; egfr: number; potassium: number;
  hfEfHistory:'unknown'|'never-reduced'|'previously-reduced'; hfFillingPressureEvidence:boolean;
  hfVolumeOverload:boolean; afKnown:boolean; hfSelectedAddOnReviewed:boolean;
  immunocompromised: boolean; secondaryBoneDisease: boolean;
  influenza: VaccineHistory; zoster: VaccineHistory;
  pneumococcal: VaccineHistory; hepb: VaccineHistory;
  riskEnabled: boolean; subclinicalAtherosclerosis: boolean;
  miMonthsAgo: number; veryHighRisk: 'unknown' | 'yes' | 'no';
  bleedingRisk: 'unknown' | 'not-high' | 'high'; oralAnticoagulation: boolean;
  antiplateletContraindication: boolean; maxStatin: boolean;
  diabetesType:'unknown'|'type1'|'type2'; type1Years:number; uacr:number|null; albuminuriaPersistent:boolean;
  preventionContext:boolean; cervix:boolean; routineBreastScreening:boolean; everSmoked:boolean; packYears:number; yearsSinceQuit:number; lungTreatmentCandidate:boolean;
  hypertensionDiagnosis:boolean; onAceArb:boolean; maxAceArb:boolean; onMra:boolean; onMetformin:boolean; onPpi:boolean; onBenzodiazepine:boolean;
}
const riskDefaults = { hfEfHistory:'unknown' as const,hfFillingPressureEvidence:false,hfVolumeOverload:false,afKnown:false,hfSelectedAddOnReviewed:false,diabetesType:'unknown' as const,type1Years:0,uacr:null,albuminuriaPersistent:false,preventionContext:false,cervix:false,routineBreastScreening:false,everSmoked:false,packYears:0,yearsSinceQuit:0,lungTreatmentCandidate:false,hypertensionDiagnosis:false,onAceArb:false,maxAceArb:false,onMra:false,onMetformin:false,onPpi:false,onBenzodiazepine:false, totalCholesterol:200,hdl:50,bmi:28,smoker:false,bpTreatment:false,statin:false,priorMi:false,dialysis:false,riskEnabled:true,subclinicalAtherosclerosis:false,miMonthsAgo:24,veryHighRisk:'unknown' as const,bleedingRisk:'unknown' as const,oralAnticoagulation:false,antiplateletContraindication:false,maxStatin:false };
export const profiles: { id: string; name: string; description: string; data: FictionalCase }[] = [
  { id: 'diabetes', name: 'Diabetes & lipids', description: 'Age 47 · diabetes · LDL-C 115', data: {
    ...riskDefaults, diabetesType:'type2',onMetformin:true,hypertensionDiagnosis:true, age: 47, sex: 'male', diabetes: true, ckd: false, veteran: true, ascvd: false,
    multipleRiskFactors: false, sbp: 134, dbp: 82, ldl: 115,
    hf: false, ef: 55, nyha: 'II', egfr: 78, potassium: 4.2, immunocompromised: false,
    secondaryBoneDisease: false, influenza: 'unknown', zoster: 'unknown', pneumococcal: 'unknown', hepb: 'unknown'
  } },
  { id: 'vaccines', name: 'Vaccination check', description: 'Age 58 · incomplete history', data: {
    ...riskDefaults, age: 58, sex: 'female', diabetes: false, ckd: false, veteran: false, ascvd: false,
    multipleRiskFactors: false, sbp: 118, dbp: 74, ldl: 105,
    hf: false, ef: 60, nyha: 'II', egfr: 90, potassium: 4.1, immunocompromised: false,
    secondaryBoneDisease: false, influenza: 'none', zoster: 'none', pneumococcal: 'unknown', hepb: 'partial'
  } },
  { id: 'hf', name: 'HFrEF overview', description: 'Age 64 · LVEF 30% · NYHA II', data: {
    ...riskDefaults, age: 64, sex: 'male', diabetes: false, ckd: false, veteran: true, ascvd: false,
    multipleRiskFactors: false, sbp: 126, dbp: 76, ldl: 95,
    hf: true, ef: 30, nyha: 'II', egfr: 62, potassium: 4.3, immunocompromised: false,
    secondaryBoneDisease: false, influenza: 'complete', zoster: 'complete', pneumococcal: 'complete', hepb: 'complete'
  } },
  { id: 'prevention', name: 'Primary prevention', description: 'Age 67 · routine prevention', data: {
    ...riskDefaults,preventionContext:true,routineBreastScreening:true, age: 67, sex: 'female', diabetes: false, ckd: false, veteran: false, ascvd: false,
    multipleRiskFactors: false, sbp: 144, dbp: 88, ldl: 120,
    hf: false, ef: 60, nyha: 'II', egfr: 85, potassium: 4.2, immunocompromised: false,
    secondaryBoneDisease: false, influenza: 'complete', zoster: 'complete', pneumococcal: 'complete', hepb: 'complete'
  } },
  { id:'post-mi',name:'After a prior MI',description:'Age 62 · MI 18 months ago',data:{
    ...riskDefaults,diabetesType:'type2',age:62,sex:'male',diabetes:true,ckd:false,veteran:true,ascvd:true,priorMi:true,miMonthsAgo:18,veryHighRisk:'yes',bleedingRisk:'not-high',bpTreatment:true,statin:true,maxStatin:true,
    multipleRiskFactors:true,sbp:134,dbp:82,ldl:85,totalCholesterol:160,hdl:45,
    hf:false,ef:55,nyha:'II',egfr:72,potassium:4.2,immunocompromised:false,secondaryBoneDisease:false,
    influenza:'complete',zoster:'complete',pneumococcal:'complete',hepb:'complete'
  } }
];
profiles.push({id:'hfpef',name:'HFpEF overview',description:'Age 72 · LVEF 60% · NYHA II',data:{...profiles[2].data,age:72,sex:'female',ef:60,egfr:55,hypertensionDiagnosis:true,hfEfHistory:'never-reduced',hfFillingPressureEvidence:true,hfVolumeOverload:true}});
profiles.push({id:'kidney',name:'Diabetes & CKD',description:'Age 61 · eGFR 35 · UACR 450',data:{...profiles[0].data,age:61,ckd:true,diabetesType:'type2',uacr:450,albuminuriaPersistent:true,egfr:35,potassium:4.6,bmi:32,onAceArb:true,maxAceArb:true,hypertensionDiagnosis:true,bpTreatment:true,statin:true,ldl:90,preventionContext:false}});

export function heartFailurePhenotype(c: FictionalCase): HfPhenotype|'none'|'unclassified' {
  if(!c.hf)return 'none';
  if(c.ef<=40)return 'hfref';
  if(c.hfEfHistory==='previously-reduced')return 'hfimpef';
  if(c.hfEfHistory!=='never-reduced'||!c.hfFillingPressureEvidence)return 'unclassified';
  return c.ef<50?'hfmref':'hfpef';
}
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
  if(c.priorMi) range(c.miMonthsAgo,0,960,'Months since MI');
  if(c.uacr!==null)range(c.uacr,0,10000,'UACR');
  range(c.bmi,10,80,'BMI');range(c.packYears,0,200,'Pack-years');range(c.yearsSinceQuit,0,100,'Years since quitting');range(c.type1Years,0,100,'Type 1 diabetes duration');
  return errors;
}
export interface Match { recommendation: Recommendation; reason: string; context?: string }
export function evaluateCase(c: FictionalCase): { matches: Match[]; gaps: string[]; errors: string[]; risk: PreventResult | null } {
  const errors = validateCase(c);
  if (errors.length) return { matches: [], gaps: [], errors, risk:null };
  const matches: Match[] = [];
  const gaps = ['Selected reference pathways only. A missing match does not mean a guideline recommends no care.',
    'All matches await independent medical verification. Contraindications, medications, pregnancy, frailty, and full risk assessment are not evaluated.'];
  const add = (rule: string, reason: string, context?: string) => {
    const recommendation = recommendations.find(r => r.rule === rule)!;
    matches.push({ recommendation, reason, context });
  };
  const hasAscvd=c.ascvd||c.priorMi;
  const hasCvd=hasAscvd||c.hf;
  const risk=c.riskEnabled?calculatePrevent(c):null;
  const cvdRisk=risk?.tenYear?.cvd;
  const ascvdRisk=risk?.tenYear?.ascvd;
  if(risk?.errors.length) gaps.push(...risk.errors.map(e=>`PREVENT withheld: ${e}`));
  if(c.subclinicalAtherosclerosis) gaps.push('Subclinical atherosclerosis selected: general PREVENT-based lipid treatment pathways are withheld; review the guideline’s CAC-specific pathway.');
  if (c.influenza !== 'complete') add('influenza', 'Adult age; no current-season vaccination documented in this fictional case.');
  if (c.age >= 50 && c.zoster !== 'complete' && !c.immunocompromised && c.zoster !== 'partial') add('zoster', 'Age ≥50; fictional RZV history is absent or unknown.');
  if (c.zoster === 'partial') gaps.push('Incomplete RZV series: review actual dose dates in the primary schedule; no dose is calculated here.');
  if (c.immunocompromised) gaps.push('Immunocompromised vaccination schedules require separate source review; selected references are available in the library.');
  if (c.age >= 50 && ['none', 'unknown'].includes(c.pneumococcal)) add('pneumococcal', 'Age ≥50; fictional conjugate vaccine history is absent or unknown.');
  if (c.pneumococcal === 'partial') gaps.push('Prior pneumococcal doses require product and date review; no catch-up pathway is encoded.');
  if (c.age >= 19 && c.age <= 59 && c.hepb !== 'complete') add('hepb', 'Age 19–59; fictional HepB series is not documented as complete.', 'Review prior products and dates before completing a series.');
  if (!hasAscvd && c.diabetes && c.age >= 40 && c.age <= 75) {
    if (c.multipleRiskFactors) add('diabetes-high-risk', 'Age 40–75, diabetes, no clinical ASCVD, and multiple risk factors explicitly selected.');
    else add('diabetes-statin', 'Age 40–75 with diabetes and no clinical ASCVD. LDL-C alone does not determine eligibility.');
  }
  const vaInScope=!(c.hf&&c.ef<=35)&&c.egfr>=15&&!c.dialysis;
  if (c.veteran && !hasAscvd && vaInScope && (c.diabetes || c.ldl >= 190)) add('va-statin', c.diabetes ? 'VA/DoD context and diabetes; no encoded scope exclusion triggered.' : 'VA/DoD context and LDL-C ≥190 mg/dL.', 'Limited life expectancy and all scope exclusions still require clinician review.');
  if(c.veteran&&!hasAscvd&&!c.diabetes&&c.ldl<190) gaps.push('VA/DoD risk-only statin matching awaits medical confirmation of the intended PREVENT endpoint. All three estimates are available; the engine does not substitute total CVD for ASCVD. Review VA/DoD recommendations 1, 7 and 8.');
  if(!hasCvd&&!c.diabetes&&!c.ckd&&!c.subclinicalAtherosclerosis&&c.ldl>=70&&c.ldl<190&&ascvdRisk!==undefined){
    const why=`10-year PREVENT-ASCVD ${displayRisk(ascvdRisk)}; age ${c.age}, LDL-C ${c.ldl} mg/dL. Unrounded risk used for matching.`;
    if(ascvdRisk>=.10){add('lipids-prevent-high',why);add('lipids-prevent-high-goal',why,'Goal applies if statin treatment is chosen.');}
    else if(ascvdRisk>=.05){add('lipids-prevent-intermediate',why);add('lipids-prevent-goal',why,'Goal applies if statin treatment is chosen.');}
    else if(ascvdRisk>=.03)add('lipids-prevent-goal',why,'This conditional goal is not an automatic instruction to start therapy. Risk enhancers and shared decision-making require review.');
    else gaps.push('Low 10-year PREVENT-ASCVD risk does not exclude treatment: review LDL-C, 30-year risk, family history and other risk enhancers in the guideline.');
  }
  if (c.hf && c.ef <= 35 && c.veteran) gaps.push('VA/DoD lipid guideline scope excludes HFrEF with EF ≤35%; that statin pathway has been withheld.');
  if (c.sbp >= 140 || c.dbp >= 90) add('hypertension', 'Fictional average BP reaches systolic ≥140 or diastolic ≥90 mmHg.');
  const higherPrimaryRisk=!hasCvd&&(c.diabetes||c.ckd||cvdRisk!==undefined&&cvdRisk>=.075);
  if (higherPrimaryRisk && c.sbp >= 130) add('hypertension-risk', `Average systolic BP ≥130, no clinical CVD; ${c.diabetes?'diabetes':c.ckd?'CKD':`calculated PREVENT-CVD ${displayRisk(cvdRisk!)} (≥7.5%)`}.`);
  if(higherPrimaryRisk&&c.dbp>=80)add('htn-risk-diastolic',`Average diastolic BP ≥80 with diabetes, CKD or PREVENT-CVD ≥7.5%; no clinical CVD.`);
  if(hasCvd&&c.sbp>=130)add('secondary-bp-systolic','Established clinical CVD with average systolic BP ≥130. No first-event risk score is needed.');
  if(hasCvd&&c.dbp>=80)add('secondary-bp-diastolic','Established clinical CVD with average diastolic BP ≥80. No first-event risk score is needed.');
  if (c.veteran && (c.sbp >= 140 || c.dbp >= 90 || c.diabetes && c.sbp >= 130 || c.ckd && c.sbp >= 130)) add('va-hypertension', 'VA/DoD context with a hypertension reference pathway.');
  if (c.sbp >= 180 || c.dbp >= 120) gaps.push('Severely elevated fictional BP is outside routine prototype triage; no urgency assessment is provided.');
  const hfType=heartFailurePhenotype(c);
  if(c.hf&&c.hfVolumeOverload)add('hf-diuretic','Known HF with congestion explicitly selected; dose requires clinical assessment.');
  if (hfType === 'hfref') {
    add('hf-nsaid-harm','HFrEF medication-safety reference; NSAID use has not been assumed.');
    if (['II', 'III'].includes(c.nyha)) add('hf-arni', 'Fictional HFrEF with LVEF ≤40% and NYHA II–III.', 'Reference match only; BP, angioedema and ACE inhibitor washout not assessed.');
    add('hf-beta', 'Fictional HFrEF with current or previous symptoms selected.');
    if (c.nyha !== 'I') {
      add('hf-sglt2', 'Fictional symptomatic chronic HFrEF; diabetes is not required.');
      if (c.egfr > 30 && c.potassium < 5) add('hf-mra', 'NYHA II–IV, eGFR >30 and potassium <5.0 in the fictional case.');
      else gaps.push('The encoded MRA eligibility criteria are not met: eGFR must be >30 and potassium <5.0. This is not a complete contraindication assessment.');
    }
  }
  if(hfType==='hfimpef')add('hfimp-continue','Prior LVEF ≤40% explicitly confirmed, now >40%; continue-GDMT reference, including NYHA I.');
  if(c.hf&&c.ef>40&&hfType==='unclassified')gaps.push('HF phenotype is unclassified: confirm prior EF trajectory and, for HFpEF/HFmrEF, objective evidence of elevated filling pressures. EF alone does not establish HFpEF.');
  if(hfType==='hfpef'||hfType==='hfmref'){
    const preserved=hfType==='hfpef';
    const reason=`Established ${preserved?'HFpEF':'HFmrEF'} with EF ${c.ef}% and filling-pressure evidence explicitly confirmed.`;
    if(c.nyha!=='I'&&c.egfr>=20&&!c.dialysis){
      add(preserved?'hfpef-sglt2':'hfmr-sglt2',reason,'2022 US grade; review drug-specific renal eligibility. eGFR 20–24 does not establish dapagliflozin initiation eligibility.');
      if(preserved)add('hfpef-acc2026-sglt2',reason,'Separate 2026 ACC expert consensus; no formal COR assigned.');
    }else gaps.push('HFpEF/HFmrEF SGLT2 match withheld: current symptoms and product-specific renal eligibility need review (encoded lower bound eGFR 20; no dialysis).');
    if(preserved){
      if(c.hypertensionDiagnosis)add('hfpef-bp',reason+' Hypertension confirmed.');
      if(c.afKnown)add('hfpef-af',reason+' Atrial fibrillation confirmed.');
      add('hfpef-nitrates',reason,'No-benefit statement applies only to routine activity/QoL use, not another established indication.');
      if(c.nyha!=='I'&&c.egfr>=25&&c.potassium<=5&&!c.dialysis&&!c.onMra)add('hfpef-acc2026-finerenone',reason,'Reference for consideration, not a prescription: FDA label eGFR ≥25 and K ≤5.0 only; complete contraindication/interaction and VA CFU review required.');
      else gaps.push('Finerenone initiation reference withheld: review symptoms, eGFR ≥25, K ≤5.0, dialysis and existing MRA therapy. Do not automatically stack MRAs.');
      if(c.hfSelectedAddOnReviewed){
        add('hfpef-arb',reason+' Selected add-on review explicitly requested.');
        add('hfpef-arni',reason+' Selected add-on review explicitly requested.','ARB and ARNI are alternatives; no combined therapy instruction.');
        if(c.egfr>30&&c.potassium<5&&!c.onMra&&!c.dialysis)add('hfpef-mra',reason+' Selected add-on review; steroidal MRA renal/potassium gate met.','2022 steroidal MRA evidence; not an instruction to combine with finerenone.');
      }
    }else if(c.hfSelectedAddOnReviewed)add('hfmr-selected',reason+' Conditional therapy review explicitly requested.','Each option needs separate eligibility review; no automatic multi-drug regimen is generated.');
    gaps.push('Selected 2022 US grades and the 2026 ACC HFpEF consensus are dated separately. The 2026 ESC recommendations are available in the library, with original ESC grades.');
  }
  if (!hasCvd && c.age >= 60) add('aspirin', 'Age ≥60 and no known clinical CVD selected; primary-prevention initiation reference.', 'Do not interpret this as advice to stop existing therapy. Bleeding risk was not assessed.');
  if (!c.secondaryBoneDisease) {
    if (c.sex === 'female' && c.age >= 65) add('osteoporosis', 'Woman aged ≥65; no known bone disease or prior fragility fracture selected.');
    if (c.sex === 'male') add('osteoporosis-men', 'Male case: USPSTF reports insufficient screening evidence.', 'An I statement is not a recommendation against screening.');
  }
  if(hasAscvd){
    gaps.push('Clinical ASCVD selected: primary-prevention lipid and aspirin pathways are withheld. Secondary prevention is shown separately; PREVENT is not a recurrent-event risk score.');
    if(c.veryHighRisk==='yes'){
      add('secondary-lipids-very-high','Clinical ASCVD and very-high-risk category explicitly confirmed against Figure 10.');
      if(c.statin&&c.maxStatin&&c.ldl>=55)add('secondary-lipids-add-on','Very-high-risk ASCVD, maximally tolerated statin explicitly selected, LDL-C ≥55 mg/dL.');
    }else if(c.veryHighRisk==='no')add('secondary-lipids-standard','Clinical ASCVD explicitly confirmed not at very high risk.');
    else gaps.push('ASCVD lipid goal is withheld until the very-high-risk category is confirmed. Figure 10: ≥2 major events, or 1 major event plus ≥2 specified high-risk conditions.');
    if(c.veteran&&vaInScope)add('secondary-va-lipids','VA/DoD context and clinical ASCVD; no encoded scope exclusion triggered.','Verify remaining scope exclusions, including life expectancy and genetic dyslipidemia.');
    if(c.priorMi){
      if(c.miMonthsAgo<12){
        add('secondary-rehab','Prior MI within the first year: review post-ACS rehabilitation referral and participation.');
        if(c.bleedingRisk==='not-high'&&!c.oralAnticoagulation&&!c.antiplateletContraindication)add('secondary-dapt','Prior MI <12 months ago; no high bleeding risk, oral anticoagulation indication, or antiplatelet contraindication explicitly selected.','Default ACS pathway only; verify PCI details and the existing regimen.');
        else gaps.push('Default post-ACS DAPT is withheld: bleeding risk is unknown/high, oral anticoagulation is indicated, or an antiplatelet contraindication is selected. Individual antithrombotic review is required.');
      }else if(c.bleedingRisk==='not-high'&&!c.oralAnticoagulation&&!c.antiplateletContraindication)add('secondary-aspirin','Prior MI ≥12 months ago; chronic coronary disease with no oral anticoagulation indication or encoded antiplatelet exclusion.','Review the current regimen; this does not instruct switching or stopping therapy.');
      else gaps.push('Chronic-coronary-disease aspirin pathway withheld pending antithrombotic and bleeding review.');
    }else gaps.push('Coronary antiplatelet pathways require prior-MI/CCD context; other ASCVD may require stroke- or PAD-specific guidance.');
  }
  const addId=(id:string,reason:string,context?:string)=>{const r=recommendations.find(r=>r.id===id);if(r)matches.push({recommendation:r,reason,context});};
  if(c.diabetes){
    addId('diabetes-ada-a1c','Diabetes selected; review the general adult target, not an automatically individualized goal.');
    addId('diabetes-ada-individualized','Diabetes selected; frailty, hypoglycemia and treatment harms require individual goal review.');
    addId('diabetes-ada-a1c-frequency','Diabetes selected; reference interval depends on stability and treatment changes.');
    addId('diabetes-foot-screening','Diabetes selected; review foot assessment and any higher-risk follow-up.');
    if(c.age>=65)addId('diabetes-older-a1c','Older adult with diabetes; health and functional status determine the target.');
    if(c.diabetesType==='type2'){
      addId('ckd-diabetes-annual','Type 2 diabetes explicitly selected; annual UACR and eGFR screening reference.');
      addId('diabetes-eye-screening','Type 2 diabetes explicitly selected; review initial and follow-up eye assessment intervals.');
      if(c.veteran)addId('diabetes-va-a1c','Type 2 diabetes with VA/DoD context; compare the individualized VA/DoD range separately from ADA.');
    }else if(c.diabetesType==='type1'&&c.type1Years>=5)addId('ckd-diabetes-annual','Type 1 diabetes duration ≥5 years explicitly entered.');
    else gaps.push('Diabetes type/duration is incomplete for type-specific screening and kidney-protective drug pathways.');
  }
  if(c.ckd){
    if(c.diabetes)addId('ckd-monitor-frequency','Diabetes and established CKD explicitly selected; reference frequency varies by stage.');
    if(c.egfr>=20&&(c.diabetes&&c.diabetesType==='type2'||c.uacr!==null&&c.uacr>=200&&c.albuminuriaPersistent||c.hf))addId('ckd-kdigo-sglt2','CKD with eGFR ≥20 plus explicitly entered type 2 diabetes, persistent UACR ≥200, or HF.','Medication safety and product-specific eligibility are not fully assessed.');
    if(c.egfr<30||c.uacr!==null&&c.uacr>700&&c.albuminuriaPersistent)addId('referral-kidney','Established CKD with eGFR <30 or persistent UACR >700.','KFRE is not calculated. Other referral criteria and urgency require review.');
    if(c.diabetes&&c.hypertensionDiagnosis&&c.egfr>=15&&c.uacr!==null&&c.uacr>=30&&c.albuminuriaPersistent)addId('ckd-kdigo-acearb','Diabetic CKD, diagnosed hypertension, eGFR ≥15 and persistent UACR ≥30 explicitly entered.');
    if(c.veteran&&c.diabetes&&c.diabetesType==='type2'&&c.uacr!==null&&c.uacr>30&&c.albuminuriaPersistent&&c.egfr>=25&&c.potassium<4.8&&c.onAceArb&&c.maxAceArb)addId('ckd-va-finerenone','Type 2 diabetes, CKD, persistent UACR >30, eGFR ≥25, K <4.8 and maximally tolerated ACEi/ARB explicitly entered.','Clinical guideline eligibility does not determine VA formulary authorization.');
    if(c.uacr===null)gaps.push('UACR is absent: albuminuria-dependent kidney therapy matches are withheld. eGFR does not substitute for UACR.');
  }
  if(c.hypertensionDiagnosis){
    addId('htn-acc-general-goal','Diagnosed hypertension; compare the overarching ACC/AHA goal with individualized and other-society guidance.');
    if(c.veteran){if(!matches.some(m=>m.recommendation.id==='va-htn-target'))addId('va-htn-target','Diagnosed hypertension with VA/DoD context.');if(c.age>=30)addId('htn-va-diastolic-goal','Diagnosed hypertension, age ≥30, with VA/DoD context.');}
    if(c.diabetes)addId(c.age>=65?'htn-older-diabetes':'htn-diabetes-goal','Diagnosed hypertension and diabetes; individual safety and tolerability require review.');
    if(c.ckd)addId('htn-kdigo-goal','Diagnosed hypertension with CKD.','KDIGO <120 uses standardized office readings; do not equate it with routine casual BP.');
  }
  if(c.onAceArb)addId('monitor-ace-arb','ACEi/ARB use explicitly selected; review start/dose-change monitoring.');
  if(c.onMra&&c.hf)addId('monitor-mra-hf','HF and MRA use explicitly selected.');
  if(c.statin)addId('monitor-lipid-treatment','Statin use explicitly selected; review monitoring after initiation or dose change.');
  if(c.onMetformin)addId('monitor-metformin-b12','Metformin use explicitly selected; assess duration and deficiency risk.');
  if(c.onPpi){addId('deprescribe-ppi-review','Long-term PPI use selected; review the ongoing indication.');addId('deprescribe-ppi-exclusions','Long-term PPI use selected; assess indications that support continuation.');}
  if(c.onBenzodiazepine){if(c.age>=65)addId('deprescribe-bzd-older','Age ≥65 with benzodiazepine use selected; individualized review required.');addId('deprescribe-bzd-withdrawal','Benzodiazepine use selected; do not infer an abrupt stop or a personalized taper.');}
  if(c.bmi>=30||c.bmi>=27&&(c.diabetes||c.hypertensionDiagnosis||hasCvd))addId('obesity-pharmacotherapy','Fictional BMI and selected comorbidities reach the ACP reference population.','Pregnancy, contraindications and VA access are not assessed.');
  if(c.bmi>=35||c.bmi>=30&&c.diabetes)addId('obesity-bariatric-thresholds','Fictional BMI reaches a selected ASMBS/IFSO pathway.','Multidisciplinary assessment and program approval remain separate.');
  if(c.preventionContext){
    const why='Asymptomatic routine-screening context explicitly confirmed; prior results and preferences still require review.';
    if(c.age>=45&&c.age<=49)addId('screen-crc-45-49',why);
    if(c.age>=50&&c.age<=75)addId('screen-crc-50-75',why);
    if(c.age>=76&&c.age<=85)addId('screen-crc-older',why,'Selective screening requires prior-screening, health and life-expectancy review.');
    if(c.routineBreastScreening&&c.age>=40&&c.age<=74)addId('screen-breast-40-74',why);
    if(c.cervix&&!c.immunocompromised&&c.age>=21&&c.age<=65)addId('screen-cervical-final',why);
    if(c.sex==='male'&&c.age>=65&&c.age<=75)addId(c.everSmoked?'screen-aaa-ever-smoked':'screen-aaa-never-smoked',why);
    if(c.sex==='male'&&c.age>=55&&c.age<=69)addId('screen-prostate-shared',why);
    if(c.sex==='male'&&c.age>=70)addId('screen-prostate-older',why);
    if(c.age>=50&&c.age<=80&&c.packYears>=20&&(c.smoker||c.yearsSinceQuit<15)&&c.lungTreatmentCandidate)addId('screen-lung-ldct','Age 50–80, ≥20 pack-years, current smoking or quit <15 years, and curative-treatment candidacy explicitly confirmed.');
    if(c.age<=65)addId('infection-hiv',why);
    if(c.age<=79)addId('infection-hcv',why);
    addId('infection-hbv',why);
  }
  addId('lifestyle-activity','Adult reference; adapt activity to clinical stability, function and ability.');
  addId('lifestyle-diet','Adult reference; personalize nutrition to health and preferences.');
  if(c.smoker)addId('lifestyle-tobacco','Current smoking explicitly selected; review cessation treatment and pregnancy-specific differences.');
  gaps.push('Broader references are available in all clinical areas. Cancer surveillance, TB/STI exposure pathways, individualized catch-up vaccines, perioperative anticoagulation and tapering are not automatic schedules.');

  return { matches, gaps, errors: [], risk };
}
