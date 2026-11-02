import {describe,it,expect} from 'vitest';
import {calculateFib4,calculateAf,interpretFrax} from './risk-tools';
const liver={age:50,ast:40,alt:25,platelets:200,acuteIllness:false};
const af={age:50,sex:'male' as const,hf:false,hypertension:false,diabetes:false,stroke:false,vascular:false,confirmedAf:true,mechanicalValve:false,mitralStenosis:false};
const bone={age:65,eligiblePopulation:true,hip:3,major:15,tScore:-1.5,priorHipOrVertebralFracture:false};
describe('FIB-4 arithmetic and 2026 CKM boundaries',()=>{
 it('computes the published formula directly',()=>expect(calculateFib4(liver).value).toBe(2));
 it('changes the lower threshold at exactly65',()=>{expect(calculateFib4({...liver,age:64}).threshold).toBe(1.3);expect(calculateFib4({...liver,age:65}).threshold).toBe(2);});
 it('uses inclusive lower and exclusive upper referral boundaries',()=>{expect(calculateFib4({...liver,ast:26}).category).toBe('secondary-assessment');expect(calculateFib4({...liver,ast:53.4}).category).toBe('secondary-assessment');expect(calculateFib4({...liver,ast:53.5}).category).toBe('hepatology');});
 it.each([{age:34},{platelets:0},{alt:-1},{ast:NaN},{acuteIllness:true}])('withholds invalid or excluded inputs %j',change=>expect(calculateFib4({...liver,...change}).value).toBeNull());
});
describe('AF-specific CHA2DS2-VASc interpretation',()=>{
 it('does not assign a risk percentage from the ordinal score',()=>expect(calculateAf(af)).toEqual({score:0,category:'below-threshold',errors:[]}));
 it('handles ages65 and75 without double-counting age',()=>{expect(calculateAf({...af,age:65}).score).toBe(1);expect(calculateAf({...af,age:75}).score).toBe(2);});
 it('applies sex-specific recommendation thresholds',()=>{expect(calculateAf({...af,hypertension:true}).category).toBe('reasonable');expect(calculateAf({...af,hypertension:true,diabetes:true}).category).toBe('recommended');expect(calculateAf({...af,sex:'female',hypertension:true}).category).toBe('reasonable');expect(calculateAf({...af,sex:'female',hypertension:true,diabetes:true}).category).toBe('recommended');});
 it('weights prior stroke/TIA/thromboembolism as two points',()=>expect(calculateAf({...af,stroke:true}).score).toBe(2));
 it.each([{confirmedAf:false},{mechanicalValve:true},{mitralStenosis:true},{age:17}])('withholds excluded AF interpretation %j',change=>expect(calculateAf({...af,...change}).score).toBeNull());
});
describe('externally calculated FRAX threshold interpretation',()=>{
 it('uses inclusive3% hip and20% major thresholds in low bone mass',()=>{expect(interpretFrax(bone).category).toBe('frax');expect(interpretFrax({...bone,hip:2.9,major:20}).category).toBe('frax');expect(interpretFrax({...bone,hip:2.9,major:19.9}).category).toBe('below-threshold');});
 it('does not apply low-bone-mass FRAX thresholds with normal BMD',()=>expect(interpretFrax({...bone,tScore:-.9,major:30}).category).toBe('below-threshold'));
 it('allows fracture/BMD criteria without unnecessary FRAX outputs',()=>{expect(interpretFrax({...bone,priorHipOrVertebralFracture:true,tScore:NaN,hip:NaN,major:NaN}).category).toBe('fracture');expect(interpretFrax({...bone,tScore:-2.5,hip:NaN,major:NaN}).category).toBe('bmd');});
 it('keeps osteoporosis and priorhip/vertebralfracture pathways independent',()=>{expect(interpretFrax({...bone,tScore:-2.5}).category).toBe('bmd');expect(interpretFrax({...bone,tScore:0,priorHipOrVertebralFracture:true}).category).toBe('fracture');});
 it.each([{hip:NaN},{major:101},{eligiblePopulation:false},{hip:30,major:20},{age:49}])('rejects invalid/excluded FRAX interpretation %j',change=>expect(interpretFrax({...bone,...change}).category).toBeNull());
});
