import { describe, expect, it } from 'vitest';
import data from '../data/prevent-coefficients.json';
import { ascvdRiskCategory, calculatePrevent, preventRisk, type PreventInputs, type RiskOutcome } from './prevent';
const base={...data.fixtureInputs,sex:'female'} as PreventInputs;
describe('PREVENT published reference fixtures',()=>{
  it.each(data.fixtures)('matches $locator ($sex, $outcome, $horizon years)',f=>{
    expect(preventRisk({...base,sex:f.sex as PreventInputs['sex']},f.horizon as 10|30,f.outcome as RiskOutcome)).toBeCloseTo(f.expected,12);
  });
  it('matches all three rounded examples printed in the primary paper',()=>{
    const result=calculatePrevent({...base,totalCholesterol:240,hdl:55,diabetes:false});
    expect((result.tenYear!.cvd*100).toFixed(1)).toBe('5.4');
    expect((result.tenYear!.ascvd*100).toFixed(1)).toBe('3.6');
    expect((result.tenYear!.hf*100).toFixed(1)).toBe('2.5');
    const smoker=calculatePrevent({...base,totalCholesterol:240,hdl:55,diabetes:false,smoker:true});
    expect((smoker.tenYear!.cvd*100).toFixed(1)).toBe('9.3');
    expect((smoker.tenYear!.ascvd*100).toFixed(1)).toBe('6.0');
    expect((smoker.tenYear!.hf*100).toFixed(1)).toBe('4.7');
  });
  it.each([{age:29},{age:80},{age:50.5},{totalCholesterol:321},{hdl:19},{sbp:89},{sbp:201},{bmi:40},{egfr:14},{hdl:NaN},{ascvd:true},{priorMi:true},{hf:true},{dialysis:true}])('withholds scores for excluded or invalid input %j',change=>{
    const result=calculatePrevent({...base,...change});expect(result.tenYear).toBeNull();expect(result.errors.length).toBeGreaterThan(0);
  });
  it('uses 30–59 for 30-year and 30–79 for 10-year estimates without extrapolation',()=>{
    expect(calculatePrevent({...base,age:30}).thirtyYear).not.toBeNull();
    expect(calculatePrevent({...base,age:59}).thirtyYear).not.toBeNull();
    expect(calculatePrevent({...base,age:60}).thirtyYear).toBeNull();
    expect(calculatePrevent({...base,age:79}).tenYear).not.toBeNull();
    expect(()=>preventRisk({...base,age:60},30,'cvd')).toThrow();
  });
  it('keeps the lipid and BP outcomes distinct and never sums component risks',()=>{
    const r=calculatePrevent(base);expect(r.tenYear!.cvd).not.toBe(r.tenYear!.ascvd);expect(r.tenYear!.cvd).not.toBe(r.tenYear!.ascvd+r.tenYear!.hf);
  });
  it.each([[.029999,'Low'],[.03,'Borderline'],[.05,'Intermediate'],[.10,'High']])('uses unrounded category threshold %s', (value,label)=>expect(ascvdRiskCategory(Number(value))).toBe(label));
  it('preserves the source checksum and exact source-cell locators',()=>{expect(data.source.sha256).toMatch(/^[a-f0-9]{64}$/);expect(data.fixtures.every(f=>f.locator.includes('S12'))).toBe(true);});
});
