import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ClipboardCopy, Check, RotateCcw } from 'lucide-react';
import { calculatePrevent } from '../lib/prevent';
import { defaultCase } from '../lib/case-defaults';
import { heartFailurePhenotype, type FictionalCase, type Recommendation, type VaccineHistory } from '../lib/guidelines';
import { statinDrugs, statinIntensity } from '../lib/meds';
import { buildPlan, type Action, type Mode } from '../lib/plan';
import { ActionCard } from './ActionCard';
import { GroupedRecommendations } from './GroupedRecommendations';
import { PreventFields, PreventResults } from './Calculators';

type SetField = <K extends keyof FictionalCase>(key: K, value: FictionalCase[K]) => void;

function Num({ label, value, unit, onChange, step = 1, optional = false }: { label: string; value: number | null; unit?: string; onChange: (v: number) => void; step?: number; optional?: boolean }) {
  return <label className="cf"><span>{label}</span><div className="cf-input"><input type="number" inputMode="decimal" step={step} value={value === null || !Number.isFinite(value) ? '' : value} placeholder={optional ? '—' : ''} onChange={e => onChange(e.target.value === '' ? NaN : Number(e.target.value))}/>{unit && <em>{unit}</em>}</div></label>;
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={onClick}>{children}</button>;
}
function Group({ title, hint, open = false, children }: { title: string; hint?: string; open?: boolean; children: ReactNode }) {
  return <details className="cg" open={open || undefined}><summary><strong>{title}</strong>{hint && <small>{hint}</small>}<ChevronDown size={15}/></summary><div className="cg-body">{children}</div></details>;
}

const SECTIONS: { kinds: Action['kind'][]; title: string; hint: string }[] = [
  { kinds: ['change'], title: 'Change', hint: 'Current therapy differs from the recommendation' },
  { kinds: ['start'], title: 'Start or consider', hint: 'Indicated, not on therapy' },
  { kinds: ['check'], title: 'Check', hint: 'Needs your judgment' },
  { kinds: ['offer'], title: 'Offer or due', hint: 'Screening, vaccines, counseling' }
];

function summaryText(actions: Action[], mode: Mode, c: FictionalCase) {
  const head = `Sage (${mode === 'va' ? 'VA/DoD guidance leads' : 'general'}) · ${c.age}${c.sex === 'male' ? 'M' : 'F'} · BP ${c.sbp}/${c.dbp} · LDL ${c.ldl} · eGFR ${c.egfr}`;
  const lines = actions.filter(a => a.kind !== 'ok').map(a => `- ${a.title}${a.detail ? `: ${a.detail}` : ''}`);
  return [head, ...lines].join('\n');
}

export function CasePage({ mode, seed, saved, toggleSave, onOpen }: {
  mode: Mode; seed: FictionalCase | null; saved: globalThis.Set<string>; toggleSave: (id: string) => void; onOpen: (r: Recommendation) => void;
}) {
  const [c, setC] = useState<FictionalCase>(() => seed ? { ...defaultCase(), ...seed } : defaultCase());
  const [copied, setCopied] = useState(false);
  const set: SetField = (key, value) => setC(p => ({ ...p, [key]: value }));
  const flip = (key: keyof FictionalCase) => set(key, !c[key] as never);
  const plan = useMemo(() => buildPlan(c, mode), [c, mode]);
  const risk = useMemo(() => c.riskEnabled ? calculatePrevent({ ...c, statin: c.statinDrug !== 'none' }) : null, [c]);
  const drug = statinDrugs.find(s => s.id === c.statinDrug);
  const hfType = heartFailurePhenotype(c);
  const hasAscvd = c.ascvd || c.priorMi;
  const optional = (key: 'a1c' | 'uacr') => (v: number) => set(key, Number.isFinite(v) ? v : null);
  const reset = () => setC(defaultCase());
  const copy = async () => { try { await navigator.clipboard.writeText(summaryText(plan.actions, mode, c)); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard unavailable */ } };
  const counts = (k: Action['kind']) => plan.actions.filter(a => a.kind === k).length;
  const ok = plan.actions.filter(a => a.kind === 'ok');
  const statinNote = c.statinDrug !== 'none' ? statinIntensity(c.statinDrug, c.statinDose) : null;

  return <div className="case-page">
    <form className="case-inputs" onSubmit={e => e.preventDefault()} aria-label="Patient numbers and medications">
      <div className="ci-top"><h2>Case</h2><button type="button" className="ci-reset" onClick={reset} aria-label="Reset case"><RotateCcw size={13}/> Reset</button></div>

      <Group title="Numbers" open>
        <div className="cf-grid">
          <Num label="Age" value={c.age} unit="y" onChange={v => set('age', v)}/>
          <label className="cf"><span>Sex</span><div className="seg"><button type="button" className={c.sex === 'male' ? 'on' : ''} onClick={() => set('sex', 'male')}>M</button><button type="button" className={c.sex === 'female' ? 'on' : ''} onClick={() => set('sex', 'female')}>F</button></div></label>
          <Num label="SBP" value={c.sbp} unit="mmHg" onChange={v => set('sbp', v)}/>
          <Num label="DBP" value={c.dbp} unit="mmHg" onChange={v => set('dbp', v)}/>
          <Num label="LDL-C" value={c.ldl} unit="mg/dL" onChange={v => set('ldl', v)}/>
          <Num label="eGFR" value={c.egfr} unit="mL/min" onChange={v => set('egfr', v)}/>
          <Num label="BMI" value={c.bmi} step={0.1} onChange={v => set('bmi', v)}/>
          {(c.diabetes || c.ckd) && <Num label="UACR" value={c.uacr} unit="mg/g" optional onChange={optional('uacr')}/>}
          {c.diabetes && <Num label="A1c" value={c.a1c} unit="%" step={0.1} optional onChange={optional('a1c')}/>}
          {(c.hf || c.ckd) && <Num label="Potassium" value={c.potassium} unit="mEq/L" step={0.1} onChange={v => set('potassium', v)}/>}
        </div>
        {c.uacr !== null && c.uacr >= 30 && <div className="chips"><Chip on={c.albuminuriaPersistent} onClick={() => flip('albuminuriaPersistent')}>Albuminuria persistent (≥3 mo)</Chip></div>}
      </Group>

      <Group title="Conditions" open>
        <div className="chips">
          <Chip on={c.diabetes} onClick={() => setC(p => ({ ...p, diabetes: !p.diabetes, diabetesType: !p.diabetes ? 'type2' : 'unknown' }))}>Diabetes</Chip>
          <Chip on={c.hypertensionDiagnosis} onClick={() => flip('hypertensionDiagnosis')}>Hypertension</Chip>
          <Chip on={c.ckd} onClick={() => flip('ckd')}>CKD</Chip>
          <Chip on={c.ascvd} onClick={() => setC(p => ({ ...p, ascvd: !p.ascvd, priorMi: p.ascvd ? false : p.priorMi }))}>ASCVD</Chip>
          <Chip on={c.priorMi} onClick={() => setC(p => ({ ...p, priorMi: !p.priorMi, ascvd: !p.priorMi ? true : p.ascvd }))}>Prior MI</Chip>
          <Chip on={c.hf} onClick={() => flip('hf')}>Heart failure</Chip>
          <Chip on={c.smoker} onClick={() => flip('smoker')}>Current smoker</Chip>
          <Chip on={c.immunocompromised} onClick={() => flip('immunocompromised')}>Immunocompromised</Chip>
          <Chip on={c.dialysis} onClick={() => flip('dialysis')}>Dialysis</Chip>
          {c.diabetes && !hasAscvd && <Chip on={c.multipleRiskFactors} onClick={() => flip('multipleRiskFactors')}>Multiple ASCVD risk factors</Chip>}
        </div>
        {c.diabetes && <label className="cf cf-wide"><span>Diabetes type</span><select value={c.diabetesType} onChange={e => set('diabetesType', e.target.value as FictionalCase['diabetesType'])}><option value="type2">Type 2</option><option value="type1">Type 1</option><option value="unknown">Not specified</option></select></label>}
        {c.diabetes && c.diabetesType === 'type1' && <Num label="Type 1 duration" value={c.type1Years} unit="y" onChange={v => set('type1Years', v)}/>}
        {hasAscvd && <div className="cf-grid">
          {c.priorMi && <Num label="Months since MI" value={c.miMonthsAgo} unit="mo" onChange={v => set('miMonthsAgo', v)}/>}
          <label className="cf"><span>Very high risk</span><select value={c.veryHighRisk} onChange={e => set('veryHighRisk', e.target.value as FictionalCase['veryHighRisk'])}><option value="unknown">Not assessed</option><option value="yes">Yes</option><option value="no">No</option></select></label>
          <label className="cf"><span>Bleeding risk</span><select value={c.bleedingRisk} onChange={e => set('bleedingRisk', e.target.value as FictionalCase['bleedingRisk'])}><option value="unknown">Not assessed</option><option value="not-high">Not high</option><option value="high">High</option></select></label>
          <div className="chips cf-wide"><Chip on={c.oralAnticoagulation} onClick={() => flip('oralAnticoagulation')}>Anticoagulant indicated</Chip><Chip on={c.antiplateletContraindication} onClick={() => flip('antiplateletContraindication')}>Antiplatelet contraindicated</Chip></div>
        </div>}
        {c.hf && <div className="cf-grid">
          <Num label="LVEF" value={c.ef} unit="%" onChange={v => set('ef', v)}/>
          <label className="cf"><span>NYHA</span><select value={c.nyha} onChange={e => set('nyha', e.target.value as FictionalCase['nyha'])}>{['I', 'II', 'III', 'IV'].map(v => <option key={v}>{v}</option>)}</select></label>
          {c.ef > 40 && <label className="cf cf-wide"><span>Prior EF</span><select value={c.hfEfHistory} onChange={e => set('hfEfHistory', e.target.value as FictionalCase['hfEfHistory'])}><option value="unknown">Not confirmed</option><option value="never-reduced">Never ≤40%</option><option value="previously-reduced">Previously ≤40%</option></select></label>}
          <div className="chips cf-wide">
            {c.ef > 40 && <Chip on={c.hfFillingPressureEvidence} onClick={() => flip('hfFillingPressureEvidence')}>Elevated filling pressure shown</Chip>}
            <Chip on={c.hfVolumeOverload} onClick={() => flip('hfVolumeOverload')}>Congested</Chip>
            <Chip on={c.afKnown} onClick={() => flip('afKnown')}>AF</Chip>
          </div>
          <p className="cf-note cf-wide">Phenotype: {({ hfref: 'HFrEF', hfmref: 'HFmrEF', hfpef: 'HFpEF', hfimpef: 'HFimpEF', unclassified: 'unclassified (confirm EF history)', none: '' })[hfType]}</p>
        </div>}
      </Group>

      <Group title="Current medications" hint={c.statinDrug !== 'none' ? `${drug?.label} ${c.statinDose} mg` : undefined} open>
        <div className="cf-grid">
          <label className="cf"><span>Statin</span><select value={c.statinDrug} onChange={e => { const d = statinDrugs.find(s => s.id === e.target.value); setC(p => ({ ...p, statinDrug: e.target.value, statinDose: d ? (d.doses[1] ?? d.doses[0]) : 0, maxStatin: false })); }}><option value="none">None</option>{statinDrugs.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
          <label className="cf"><span>Dose</span><select value={c.statinDose} disabled={!drug} onChange={e => set('statinDose', Number(e.target.value))}>{drug ? drug.doses.map(d => <option key={d} value={d}>{d} {drug.unit}</option>) : <option value={0}>—</option>}</select></label>
        </div>
        {statinNote && <p className="cf-note">{statinNote === 'none' ? 'Dose not in the intensity table.' : `${statinNote[0].toUpperCase()}${statinNote.slice(1)} intensity`}</p>}
        <div className="chips">
          {c.statinDrug !== 'none' && <Chip on={c.maxStatin} onClick={() => flip('maxStatin')}>Can't tolerate higher statin dose</Chip>}
          <Chip on={c.ezetimibe} onClick={() => flip('ezetimibe')}>Ezetimibe</Chip>
          <Chip on={c.pcsk9} onClick={() => flip('pcsk9')}>PCSK9 inhibitor</Chip>
          <Chip on={c.onAceArb} onClick={() => setC(p => ({ ...p, onAceArb: !p.onAceArb, maxAceArb: p.onAceArb ? false : p.maxAceArb }))}>ACEi / ARB</Chip>
          {c.onAceArb && <Chip on={c.maxAceArb} onClick={() => flip('maxAceArb')}>at max tolerated dose</Chip>}
          <Chip on={c.arni} onClick={() => flip('arni')}>ARNI</Chip>
          <Chip on={c.betaBlocker} onClick={() => flip('betaBlocker')}>Beta-blocker</Chip>
          <Chip on={c.sglt2} onClick={() => flip('sglt2')}>SGLT2 inhibitor</Chip>
          <Chip on={c.glp1} onClick={() => flip('glp1')}>GLP-1 RA</Chip>
          <Chip on={c.onMra} onClick={() => flip('onMra')}>MRA</Chip>
          <Chip on={c.onMetformin} onClick={() => flip('onMetformin')}>Metformin</Chip>
          <Chip on={c.aspirin} onClick={() => flip('aspirin')}>Aspirin</Chip>
          <Chip on={c.bpTreatment} onClick={() => flip('bpTreatment')}>Other BP medication</Chip>
          <Chip on={c.onPpi} onClick={() => flip('onPpi')}>Long-term PPI</Chip>
          <Chip on={c.onBenzodiazepine} onClick={() => flip('onBenzodiazepine')}>Benzodiazepine</Chip>
        </div>
      </Group>

      <Group title="Vaccines" hint="Unknown counts as not documented">
        <div className="cf-grid">{([['influenza', 'Influenza'], ['zoster', 'Zoster (RZV)'], ['pneumococcal', 'Pneumococcal'], ['hepb', 'Hepatitis B']] as const).map(([key, label]) =>
          <label className="cf" key={key}><span>{label}</span><select value={c[key]} onChange={e => set(key, e.target.value as VaccineHistory)}><option value="unknown">Unknown</option><option value="none">None</option><option value="partial">Partial</option><option value="complete">Up to date</option></select></label>)}</div>
      </Group>

      <Group title="Screening eligibility" hint={c.preventionContext ? 'Routine screening on' : 'Off'}>
        <div className="chips">
          <Chip on={c.preventionContext} onClick={() => flip('preventionContext')}>Asymptomatic, routine screening</Chip>
          {c.preventionContext && <>
            {c.sex === 'female' && <Chip on={c.routineBreastScreening} onClick={() => flip('routineBreastScreening')}>Breast screening population</Chip>}
            {c.sex === 'female' && <Chip on={c.cervix} onClick={() => flip('cervix')}>Cervix present</Chip>}
            <Chip on={c.everSmoked} onClick={() => flip('everSmoked')}>Smoked ≥100 cigarettes</Chip>
            <Chip on={c.lungTreatmentCandidate} onClick={() => flip('lungTreatmentCandidate')}>Fit for lung cancer treatment</Chip>
          </>}
        </div>
        {c.preventionContext && <div className="cf-grid"><Num label="Pack-years" value={c.packYears} step={0.5} onChange={v => set('packYears', v)}/><Num label="Years since quit" value={c.yearsSinceQuit} step={0.5} onChange={v => set('yearsSinceQuit', v)}/></div>}
      </Group>

      <Group title="PREVENT inputs" hint={risk?.tenYear ? `ASCVD ${(risk.tenYear.ascvd * 100).toFixed(1)}%` : hasAscvd || c.hf ? 'Not for established disease' : undefined}>
        <div className="chips"><Chip on={c.riskEnabled} onClick={() => flip('riskEnabled')}>Calculate PREVENT</Chip></div>
        {c.riskEnabled && <PreventFields value={{ ...c, statin: c.statinDrug !== 'none' }} onChange={(key, value) => set(key as keyof FictionalCase, value as never)} hideBmi hideFlags/>}
      </Group>
    </form>

    <section className="case-plan" aria-live="polite" aria-label="Recommendations">
      {plan.errors.length > 0 ? <div className="plan-errors" role="alert">{plan.errors.map(e => <p key={e}>{e}</p>)}</div> : <>
        <div className="plan-head">
          <div className="plan-counts">
            <span className={counts('change') ? 'hot' : ''}><b>{counts('change')}</b> change</span>
            <span><b>{counts('start')}</b> start</span>
            <span><b>{counts('check')}</b> check</span>
            <span><b>{counts('offer')}</b> offer</span>
          </div>
          <button className="copy-btn" onClick={copy} type="button">{copied ? <><Check size={13}/> Copied</> : <><ClipboardCopy size={13}/> Copy summary</>}</button>
        </div>
        {mode === 'va' && <p className="mode-line">West Haven VA mode: VA/DoD guidance leads, other societies are listed under each item, formulary status is shown for suggested drugs.</p>}
        {SECTIONS.map(s => { const items = plan.actions.filter(a => s.kinds.includes(a.kind)); return items.length > 0 && <div className="plan-section" key={s.title}><h2>{s.title}<small>{s.hint}</small></h2>{items.map(a => <ActionCard key={a.id} action={a} mode={mode} onOpen={onOpen}/>)}</div>; })}
        {plan.actions.length === 0 && <p className="plan-empty">Nothing flagged for these inputs.</p>}
        {ok.length > 0 && <details className="plan-fold"><summary>On track ({ok.length})</summary>{ok.map(a => <ActionCard key={a.id} action={a} mode={mode} onOpen={onOpen}/>)}</details>}
        {risk && !risk.errors.length && risk.tenYear && <details className="plan-fold"><summary>PREVENT estimates</summary><PreventResults result={risk} compact/></details>}
        {plan.other.length > 0 && <details className="plan-fold"><summary>Other applicable guidance ({plan.other.length})</summary><GroupedRecommendations rows={plan.other.map(m => m.recommendation)} saved={saved} onSave={toggleSave} onOpen={onOpen} matches={plan.other}/></details>}
        {plan.needsInput.length > 0 && <details className="plan-fold"><summary>Missing input or withheld ({plan.needsInput.length})</summary><ul className="needs-input">{plan.needsInput.map(g => <li key={g}>{g}</li>)}</ul></details>}
      </>}
    </section>
  </div>;
}
