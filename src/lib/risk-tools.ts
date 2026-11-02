export interface Fib4Inputs {age:number;ast:number;alt:number;platelets:number;acuteIllness:boolean}
export function calculateFib4(p:Fib4Inputs) {
 const errors:string[]=[];
 if(!Number.isInteger(p.age)||p.age<35||p.age>100)errors.push('This pathway requires an adult age 35–100. FIB-4 interpretation is withheld below 35.');
 for(const k of ['ast','alt','platelets'] as const)if(!Number.isFinite(p[k])||p[k]<=0)errors.push(`${k}: a finite positive value is required.`);
 if(p.acuteIllness)errors.push('Do not use FIB-4 during acute illness.');
 if(errors.length)return {value:null,threshold:null,category:null,errors};
 const value=p.age*p.ast/(p.platelets*Math.sqrt(p.alt));
 if(!Number.isFinite(value))return {value:null,threshold:null,category:null,errors:['Inputs produce an invalid score.']};
 const threshold=p.age>=65?2:1.3;
 return {value,threshold,category:value>2.67?'hepatology':value>=threshold?'secondary-assessment':'lower-risk',errors};
}
export interface AfInputs {age:number;sex:'male'|'female';hf:boolean;hypertension:boolean;diabetes:boolean;stroke:boolean;vascular:boolean;confirmedAf:boolean;mechanicalValve:boolean;mitralStenosis:boolean}
export function calculateAf(p:AfInputs) {
 const errors:string[]=[];
 if(!Number.isInteger(p.age)||p.age<18||p.age>100)errors.push('Enter a fictional adult age 18–100.');
 if(!['female','male'].includes(p.sex))errors.push('Choose the sex category used in CHA₂DS₂-VASc.');
 if(!p.confirmedAf)errors.push('AF-specific anticoagulation interpretation requires confirmed AF. This is not an AF diagnostic tool.');
 if(p.mechanicalValve||p.mitralStenosis)errors.push('Mechanical valve or moderate/severe rheumatic mitral stenosis: use the specific valvular anticoagulation pathway; this interpretation is withheld.');
 if(errors.length)return {score:null,category:null,errors};
 const score=(p.age>=75?2:p.age>=65?1:0)+Number(p.sex==='female')+Number(p.hf)+Number(p.hypertension)+Number(p.diabetes)+2*Number(p.stroke)+Number(p.vascular);
 const threshold=p.sex==='female'?3:2;
 return {score,category:score>=threshold?'recommended':score===threshold-1?'reasonable':'below-threshold',errors};
}
export interface FraxInputs {age:number;eligiblePopulation:boolean;hip:number;major:number;tScore:number;priorHipOrVertebralFracture:boolean}
export function interpretFrax(p:FraxInputs) {
 const errors:string[]=[];
 if(!Number.isInteger(p.age)||p.age<50||p.age>90)errors.push('This selected U.S. BHOF pathway uses age 50–90; use the original guideline outside this range.');
 if(!p.eligiblePopulation)errors.push('Confirm the BHOF population: postmenopausal woman or man aged ≥50.');
 if(p.priorHipOrVertebralFracture)return errors.length?{category:null,errors}:{category:'fracture',errors};
 if(!Number.isFinite(p.tScore)||p.tScore < -10||p.tScore>10)errors.push('Enter a finite DXA T-score in the displayed range.');
 if(errors.length)return {category:null,errors};
 if(p.tScore<=-2.5)return {category:'bmd',errors};
 if(p.tScore>-1)return {category:'below-threshold',errors};
 for(const k of ['hip','major'] as const)if(!Number.isFinite(p[k])||p[k]<0||p[k]>100)errors.push(`${k} fracture probability must be 0–100%.`);
 if(p.hip>p.major)errors.push('Hip probability cannot exceed major osteoporotic fracture probability. Check the source FRAX outputs.');
 if(errors.length)return {category:null,errors};
 return {category:p.hip>=3||p.major>=20?'frax':'below-threshold',errors};
}
