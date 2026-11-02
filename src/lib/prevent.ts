import published from '../data/prevent-coefficients.json';

export interface PreventInputs {
  age: number; sex: 'female' | 'male'; totalCholesterol: number; hdl: number;
  sbp: number; bmi: number; egfr: number; diabetes: boolean; smoker: boolean;
  bpTreatment: boolean; statin: boolean; ascvd: boolean; hf: boolean;
  priorMi: boolean; dialysis: boolean;
}
export type RiskOutcome = 'cvd' | 'ascvd' | 'hf';
export type RiskSet = Record<RiskOutcome, number>;
export interface PreventResult { tenYear: RiskSet | null; thirtyYear: RiskSet | null; errors: string[]; notes: string[] }
export const preventProvenance = published.source;
export function validatePrevent(p: PreventInputs) {
  const errors: string[] = [];
  const check = (v: number, lo: number, hi: number, label: string) => { if (!Number.isFinite(v) || v < lo || v > hi) errors.push(`${label}: enter ${lo}–${hi}. Values are not clamped.`); };
  check(p.age,30,79,'Age (years)');
  if (!Number.isInteger(p.age)) errors.push('Age must be a whole number.');
  check(p.totalCholesterol,130,320,'Total cholesterol (mg/dL)'); check(p.hdl,20,100,'HDL-C (mg/dL)');
  check(p.sbp,90,200,'Systolic BP (mmHg)'); check(p.egfr,15,150,'eGFR (mL/min/1.73 m²)');
  if(!Number.isFinite(p.bmi)||p.bmi<18.5||p.bmi>=40) errors.push('BMI (kg/m²): enter ≥18.5 and <40. Values are not clamped.');
  if(p.totalCholesterol<=p.hdl) errors.push('Total cholesterol must exceed HDL-C.');
  if(!['female','male'].includes(p.sex)) errors.push('Select a sex-specific equation.');
  for (const key of ['diabetes','smoker','bpTreatment','statin','ascvd','hf','priorMi','dialysis'] as const) if(typeof p[key]!=='boolean') errors.push(`${key}: an explicit yes/no value is required.`);
  if(p.ascvd||p.priorMi||p.hf) errors.push('PREVENT estimates first events: it is not applicable with known ASCVD, prior MI, or heart failure. Use secondary-prevention or HF guidance.');
  if(p.dialysis) errors.push('PREVENT is not applied to a fictional case on dialysis.');
  return errors;
}
export function preventRisk(p: PreventInputs, horizon: 10 | 30, outcome: RiskOutcome): number {
  const errors = validatePrevent(p);
  if(errors.length) throw new Error(errors.join(' '));
  if(horizon===30 && p.age>=60) throw new Error('30-year PREVENT is restricted to ages 30–59 in this implementation, following current AHA calculator guidance.');
  const a=(p.age-55)/10, n=(p.totalCholesterol-p.hdl)*0.02586-3.5, h=(p.hdl*0.02586-1.3)/0.3;
  const s1=(Math.min(p.sbp,110)-110)/20, s2=(Math.max(p.sbp,110)-130)/20;
  const b1=(Math.min(p.bmi,30)-25)/5, b2=(Math.max(p.bmi,30)-30)/5;
  const g1=(Math.min(p.egfr,60)-60)/-15, g2=(Math.max(p.egfr,60)-90)/-15;
  const d=Number(p.diabetes),sm=Number(p.smoker),bp=Number(p.bpTreatment),st=Number(p.statin);
  const terms: Record<string,number>={age:a,ageSquared:a*a,nonHdl:n,hdl:h,sbpLow:s1,sbpHigh:s2,diabetes:d,smoker:sm,bmiLow:b1,bmiHigh:b2,egfrLow:g1,egfrHigh:g2,bpTreatment:bp,statin:st,treatedSbp:bp*s2,treatedNonHdl:st*n,ageNonHdl:a*n,ageHdl:a*h,ageSbp:a*s2,ageDiabetes:a*d,ageSmoker:a*sm,ageBmi:a*b2,ageEgfr:a*g1,intercept:1};
  const model=published.models[horizon===10?'10':'30'][outcome][p.sex].coefficients;
  const logOdds=Object.entries(model).reduce((sum,[key,beta])=>sum+beta*terms[key],0);
  return 1/(1+Math.exp(-logOdds));
}
export function calculatePrevent(p: PreventInputs): PreventResult {
  const errors=validatePrevent(p);
  const notes=['Published simplified PREVENT base model. No UACR, HbA1c or SDI extensions are applied.','Total CVD, ASCVD and HF risks overlap; do not add them. Results do not estimate benefit from a treatment.'];
  if(errors.length) return {tenYear:null,thirtyYear:null,errors,notes};
  const score=(h:10|30):RiskSet=>({cvd:preventRisk(p,h,'cvd'),ascvd:preventRisk(p,h,'ascvd'),hf:preventRisk(p,h,'hf')});
  if(p.age>=60)notes.push('30-year estimates are withheld at age 60 or older.');
  return {tenYear:score(10),thirtyYear:p.age<60?score(30):null,errors:[],notes};
}
export function ascvdRiskCategory(risk: number) { return risk<.03?'Low':risk<.05?'Borderline':risk<.10?'Intermediate':'High'; }
export const displayRisk=(risk:number)=>`${(risk*100).toFixed(1)}%`;
