import { profiles, type FictionalCase } from './guidelines';

// A neutral adult. Every field the form edits is set explicitly so no example case leaks in.
export const defaultCase = (): FictionalCase => ({
  ...profiles.find(p => p.id === 'va-visit')!.data,
  age: 60, sex: 'male', sbp: 128, dbp: 78, ldl: 110, egfr: 90, bmi: 28, potassium: 4.2, totalCholesterol: 200, hdl: 50,
  diabetes: false, diabetesType: 'unknown', type1Years: 0, ckd: false, ascvd: false, priorMi: false, miMonthsAgo: 24,
  multipleRiskFactors: false, hf: false, ef: 55, nyha: 'II', hfEfHistory: 'unknown', hfFillingPressureEvidence: false,
  hfVolumeOverload: false, afKnown: false, hfSelectedAddOnReviewed: false, hypertensionDiagnosis: false,
  smoker: false, immunocompromised: false, dialysis: false, secondaryBoneDisease: false, subclinicalAtherosclerosis: false,
  uacr: null, albuminuriaPersistent: false, a1c: null, veryHighRisk: 'unknown', bleedingRisk: 'unknown',
  oralAnticoagulation: false, antiplateletContraindication: false,
  preventionContext: true, routineBreastScreening: false, cervix: false, everSmoked: false, packYears: 0, yearsSinceQuit: 0, lungTreatmentCandidate: false,
  influenza: 'unknown', zoster: 'unknown', pneumococcal: 'unknown', hepb: 'unknown',
  riskEnabled: true, veteran: false,
  statin: false, statinDrug: 'none', statinDose: 0, maxStatin: false, ezetimibe: false, pcsk9: false, sglt2: false, glp1: false,
  aspirin: false, betaBlocker: false, arni: false, bpTreatment: false, onAceArb: false, maxAceArb: false, onMra: false,
  onMetformin: false, onPpi: false, onBenzodiazepine: false
});
