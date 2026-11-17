import { evaluateCase, heartFailurePhenotype, recommendations, sourceFor, type FictionalCase, type Match } from './guidelines';
import { intensityRank, statinIntensity, statinLabel, type FormularyClass, type StatinIntensity } from './meds';

export type Mode = 'general' | 'va';
export type ActionKind = 'change' | 'start' | 'offer' | 'check' | 'ok';

export interface Action {
  id: string;
  kind: ActionKind;
  title: string;
  detail: string;
  /** Records that drive the item. In VA mode VA/DoD records lead; in general mode they follow. */
  primary: Match[];
  /** Records from the other side of the VA/non-VA split, shown as "also" or "differs". */
  alt: Match[];
  altLabel?: string;
  bullets?: string[];
  formulary?: FormularyClass[];
}

export interface Plan {
  actions: Action[];
  /** Matched records not already shown in an action. */
  other: Match[];
  needsInput: string[];
  errors: string[];
}

const isVa = (m: Match) => sourceFor(m.recommendation).society.startsWith('VA / DoD');
const GENERIC_GAPS = [/^Selected reference pathways only/, /^All matches await/, /^Broader references are available/];

export function buildPlan(input: FictionalCase, mode: Mode): Plan {
  const c: FictionalCase = { ...input, veteran: mode === 'va', statin: input.statinDrug !== 'none' };
  const result = evaluateCase(c);
  if (result.errors.length) return { actions: [], other: [], needsInput: [], errors: result.errors };

  const matches = result.matches;
  const used = new Set<string>();
  const has = (...keys: string[]) => matches.some(m => keys.includes(m.recommendation.id) || keys.includes(m.recommendation.rule));
  const pick = (...keys: string[]) => matches.filter(m => keys.includes(m.recommendation.id) || keys.includes(m.recommendation.rule));
  // A record that applies by the clinician's own reasoning even when no engine rule fired.
  const mk = (id: string, reason: string): Match[] => {
    const found = matches.find(m => m.recommendation.id === id);
    if (found) return [found];
    const recommendation = recommendations.find(r => r.id === id);
    return recommendation ? [{ recommendation, reason }] : [];
  };
  const split = (ms: Match[]) => {
    const uniq = [...new Map(ms.map(m => [m.recommendation.id, m])).values()];
    const va = uniq.filter(isVa); const other = uniq.filter(m => !isVa(m));
    if (mode === 'va') return va.length ? { primary: va, alt: other, altLabel: 'Other societies' } : { primary: other, alt: [], altLabel: '' };
    return other.length ? { primary: other, alt: va, altLabel: 'VA/DoD' } : { primary: va, alt: [], altLabel: '' };
  };
  const actions: Action[] = [];
  const add = (a: Omit<Action, 'primary' | 'alt' | 'altLabel'> & { recs: Match[] }) => {
    const { recs, ...rest } = a;
    const s = split(recs);
    [...s.primary, ...s.alt].forEach(m => used.add(m.recommendation.id));
    actions.push({ ...rest, ...s });
  };

  const hasAscvd = c.ascvd || c.priorMi;
  const va = mode === 'va';

  // ---- Statin and lipids ---------------------------------------------------
  const cur: StatinIntensity = statinIntensity(c.statinDrug, c.statinDose);
  const onStatin = cur !== 'none';
  const curLabel = onStatin ? `${statinLabel(c.statinDrug, c.statinDose)} (${cur} intensity)` : 'no statin';
  const accReq: 'high' | 'moderate' | null = hasAscvd || has('diabetes-high-risk', 'lipids-prevent-high') ? 'high'
    : has('diabetes-statin', 'lipids-prevent-intermediate') ? 'moderate' : null;
  const vaRule = hasAscvd ? 'secondary' : has('va-statin') ? 'primary' : null;
  const lipidRecs = pick('diabetes-statin', 'diabetes-high-risk', 'lipids-prevent-high', 'lipids-prevent-intermediate', 'va-statin', 'secondary-lipids-standard', 'secondary-lipids-very-high', 'secondary-va-lipids');
  if (hasAscvd) lipidRecs.push(...mk('secondary-lipids-standard', 'Clinical ASCVD.'), ...mk('secondary-va-lipids', 'Clinical ASCVD.'));
  const nonstatin = c.ezetimibe || c.pcsk9;
  // The guidance that decides what counts as "enough" in the current mode.
  let required: StatinIntensity | null = accReq;
  let satisfied = !!accReq && intensityRank[cur] >= intensityRank[accReq];
  let requirement = accReq ? `${accReq}-intensity statin (ACC/AHA 2026)` : '';
  if (va && vaRule === 'secondary') {
    required = 'high';
    satisfied = cur === 'high' || (cur === 'moderate' && nonstatin);
    requirement = 'high-intensity statin, or moderate-intensity plus ezetimibe or a PCSK9 inhibitor (VA/DoD)';
  } else if (va && vaRule === 'primary') {
    required = 'moderate';
    satisfied = intensityRank[cur] >= intensityRank.moderate;
    requirement = 'at least moderate-intensity statin (VA/DoD)';
  }
  if (required) {
    if (!onStatin) {
      add({ id: 'statin', kind: 'start', title: `Start ${required}-intensity statin`, detail: `No statin entered. Recommended: ${requirement}.`, recs: lipidRecs, formulary: [required === 'high' ? 'statin-high' : 'statin-moderate', ...(va && vaRule === 'secondary' ? ['ezetimibe' as const] : [])] });
    } else if (!satisfied && c.maxStatin) {
      add({ id: 'statin', kind: 'check', title: 'Below recommended intensity, marked maximally tolerated', detail: `On ${curLabel}. Recommended: ${requirement}. A nonstatin add-on is the usual route when the statin cannot be raised.`, recs: lipidRecs, formulary: ['ezetimibe'] });
    } else if (!satisfied) {
      add({ id: 'statin', kind: 'change', title: `Intensify statin to ${required} intensity`, detail: `On ${curLabel}. Recommended: ${requirement}.${va && vaRule === 'secondary' ? ' Adding ezetimibe to the current moderate-intensity statin also meets the VA/DoD suggestion.' : ''}`, recs: lipidRecs, formulary: [required === 'high' ? 'statin-high' : 'statin-moderate', ...(va && vaRule === 'secondary' ? ['ezetimibe' as const] : [])] });
    } else {
      add({ id: 'statin', kind: 'ok', title: 'Statin intensity meets guidance', detail: `On ${curLabel}. Recommended: ${requirement}.`, recs: lipidRecs });
    }
  }
  // Diabetes outside the encoded 40–75 statin recommendation: say so instead of staying silent.
  if (!required && !onStatin && !hasAscvd && c.diabetes && (c.age < 40 || c.age > 75)) {
    const factors = [c.ckd && `CKD (eGFR ${c.egfr})`, c.uacr !== null && c.uacr >= 30 && `UACR ${c.uacr}`, c.smoker && 'current smoking', c.hypertensionDiagnosis && 'hypertension', c.ldl >= 160 && `LDL-C ${c.ldl}`].filter(Boolean);
    const ascvd10 = result.risk?.tenYear?.ascvd;
    add({ id: 'statin-outside', kind: 'check', title: `Statin: age ${c.age} is outside the 40–75 diabetes recommendation`,
      detail: `The encoded ACC/AHA diabetes statin recommendation covers ages 40–75, so Sage neither recommends nor excludes one here. ${factors.length ? `Entered: ${factors.join(', ')}. ` : ''}${ascvd10 !== undefined ? `PREVENT 10-year ASCVD ${(ascvd10 * 100).toFixed(1)}%. ` : ''}Individualize.`,
      recs: mk('lipids-diabetes', 'Diabetes without clinical ASCVD.'), formulary: ['statin-moderate'] });
  }
  // LDL above goal on a high-intensity or maximally tolerated statin (ASCVD)
  const goal = c.veryHighRisk === 'yes' ? 55 : 70;
  if (hasAscvd && onStatin && (cur === 'high' || c.maxStatin) && c.ldl >= goal) {
    const goalNote = `LDL-C ${c.ldl} mg/dL vs goal <${goal}${c.veryHighRisk === 'yes' ? ' (very high risk)' : c.veryHighRisk === 'no' ? '' : ' (<55 if very high risk: confirm category)'} on ${curLabel}.`;
    const recs = [...mk('secondary-lipids-add-on', 'Very-high-risk ASCVD on maximally tolerated statin.'), ...mk(c.veryHighRisk === 'yes' ? 'secondary-lipids-very-high' : 'secondary-lipids-standard', 'Clinical ASCVD.'), ...mk('secondary-va-lipids', 'Clinical ASCVD.')];
    if (!c.ezetimibe) add({ id: 'ldl-ezetimibe', kind: 'change', title: 'Add ezetimibe', detail: goalNote, recs, formulary: ['ezetimibe'] });
    else if (!c.pcsk9) add({ id: 'ldl-pcsk9', kind: 'change', title: 'Add a PCSK9 inhibitor', detail: `${goalNote} Already on ezetimibe.`, recs, formulary: ['pcsk9'] });
    else add({ id: 'ldl-refractory', kind: 'check', title: 'LDL-C above goal on statin, ezetimibe and PCSK9 inhibitor', detail: `${goalNote} Confirm adherence and consider lipid-clinic input.`, recs });
  } else if (!hasAscvd && onStatin && satisfied) {
    const primaryGoal = has('lipids-prevent-high-goal', 'diabetes-high-risk') ? 70 : has('diabetes-statin', 'lipids-prevent-goal') ? 100 : null;
    if (primaryGoal && c.ldl >= primaryGoal) add({ id: 'ldl-goal', kind: 'check', title: `LDL-C above the ACC/AHA goal (<${primaryGoal})`, detail: `LDL-C ${c.ldl} mg/dL on ${curLabel}. Check adherence; consider intensifying or adding ezetimibe.`, recs: pick('lipids-prevent-high-goal', 'lipids-prevent-goal', 'diabetes-high-risk', 'diabetes-statin'), formulary: ['ezetimibe'] });
  }

  // ---- Blood pressure ------------------------------------------------------
  const bpRecs = pick('hypertension', 'hypertension-risk', 'htn-risk-diastolic', 'secondary-bp-systolic', 'secondary-bp-diastolic', 'va-hypertension');
  const vaAbove = va && c.hypertensionDiagnosis && c.sbp >= 130;
  if (bpRecs.length || vaAbove) {
    const recs = [...bpRecs, ...(va ? mk('va-htn-target', 'VA/DoD systolic goal <130 mmHg.') : [])];
    const goalText = va ? 'VA/DoD goal: systolic <130 mmHg.' : hasAscvd || c.diabetes || c.ckd ? 'Treatment threshold: systolic ≥130 or diastolic ≥80 in this group.' : 'Treatment threshold: ≥140/90.';
    const albuminuric = c.diabetes && c.uacr !== null && c.uacr >= 30;
    add({ id: 'bp', kind: c.bpTreatment ? 'check' : 'start', title: c.bpTreatment ? 'BP above goal on treatment' : 'Start BP treatment', detail: `Average ${c.sbp}/${c.dbp} mmHg. ${goalText}${albuminuric ? ' Albuminuria: ACEi/ARB preferred.' : ''}`, recs, formulary: albuminuric ? ['acearb', 'thiazide', 'ccb'] : ['thiazide', 'acearb', 'ccb'] });
  } else if (c.hypertensionDiagnosis && c.bpTreatment) {
    add({ id: 'bp', kind: 'ok', title: 'BP at goal on treatment', detail: `Average ${c.sbp}/${c.dbp} mmHg.`, recs: pick('htn-acc-general-goal', 'va-htn-target') });
  }

  // ---- Kidney, diabetes and heart-failure drug classes ---------------------
  if (has('ckd-kdigo-acearb')) {
    const recs = pick('ckd-kdigo-acearb');
    if (!c.onAceArb) add({ id: 'acearb', kind: 'start', title: 'Start ACE inhibitor or ARB', detail: `Diabetic CKD with persistent albuminuria (UACR ${c.uacr} mg/g).`, recs, formulary: ['acearb'] });
    else if (!c.maxAceArb) add({ id: 'acearb', kind: 'check', title: 'Titrate ACEi/ARB to maximum tolerated dose', detail: `Albuminuric diabetic CKD (UACR ${c.uacr} mg/g). Watch creatinine and potassium.`, recs, formulary: ['acearb'] });
    else add({ id: 'acearb', kind: 'ok', title: 'ACEi/ARB at maximum tolerated dose', detail: `Albuminuric diabetic CKD (UACR ${c.uacr} mg/g).`, recs });
  }
  const sglt2Recs = pick('ckd-kdigo-sglt2', 'hf-sglt2', 'hfpef-sglt2', 'hfmr-sglt2', 'hfpef-acc2026-sglt2');
  if (sglt2Recs.length) {
    const why = [c.ckd && 'CKD', c.hf && 'heart failure', c.diabetes && 'diabetes'].filter(Boolean).join(', ');
    add({ id: 'sglt2', kind: c.sglt2 ? 'ok' : 'start', title: c.sglt2 ? 'On an SGLT2 inhibitor' : 'Start SGLT2 inhibitor', detail: `${why}${c.ckd ? `; eGFR ${c.egfr}` : ''}.`, recs: sglt2Recs, formulary: c.sglt2 ? undefined : ['sglt2'] });
  }
  if (has('ckd-va-glp1')) add({ id: 'glp1', kind: c.glp1 ? 'ok' : 'start', title: c.glp1 ? 'On a GLP-1 receptor agonist' : 'Add a GLP-1 receptor agonist', detail: `Type 2 diabetes with albuminuric CKD on ACEi/ARB (UACR ${c.uacr} mg/g).`, recs: pick('ckd-va-glp1'), formulary: c.glp1 ? undefined : ['glp1'] });
  const nsmra = pick('ckd-va-finerenone', 'ckd-kdigo-nsmra');
  if (nsmra.length) add({ id: 'nsmra', kind: c.onMra ? 'ok' : 'start', title: c.onMra ? 'On an MRA' : 'Consider finerenone', detail: `Type 2 diabetes, UACR ${c.uacr} mg/g, eGFR ${c.egfr}, K ${c.potassium} on maximally tolerated ACEi/ARB.`, recs: nsmra, formulary: c.onMra ? undefined : ['nsmra'] });

  const hfType = heartFailurePhenotype(c);
  if (hfType === 'hfref') {
    const missing: string[] = [];
    const formulary: FormularyClass[] = [];
    if (!c.arni && !c.onAceArb) { missing.push('ARNI (or ACEi/ARB)'); formulary.push('arni'); }
    if (!c.betaBlocker) { missing.push('evidence-based beta-blocker'); formulary.push('betablocker-hf'); }
    if (has('hf-mra') && !c.onMra) { missing.push('MRA'); formulary.push('mra'); }
    if (has('hf-sglt2') && !c.sglt2) { missing.push('SGLT2 inhibitor'); formulary.push('sglt2'); }
    const recs = pick('hf-arni', 'hf-beta', 'hf-mra', 'hf-sglt2', 'hf-nsaid-harm', 'hf-diuretic');
    add(missing.length
      ? { id: 'hfref', kind: 'start', title: `HFrEF: missing ${missing.length === 1 ? 'a pillar' : missing.length + ' pillars'}`, detail: `LVEF ${c.ef}%, NYHA ${c.nyha}. Not on: ${missing.join(', ')}.`, recs, formulary }
      : { id: 'hfref', kind: 'ok', title: 'HFrEF: all four pillars in place', detail: `LVEF ${c.ef}%, NYHA ${c.nyha}.`, recs });
  }

  // ---- Antithrombotic ------------------------------------------------------
  if (has('secondary-aspirin')) add({ id: 'aspirin-secondary', kind: c.aspirin ? 'ok' : 'start', title: c.aspirin ? 'On aspirin for chronic coronary disease' : 'Start low-dose aspirin', detail: 'Prior MI ≥12 months, no oral anticoagulation indication or antiplatelet contraindication entered.', recs: pick('secondary-aspirin') });
  if (has('secondary-dapt')) add({ id: 'dapt', kind: 'check', title: 'Confirm aspirin plus P2Y12 inhibitor after ACS', detail: `MI ${c.miMonthsAgo} months ago; default is at least one year when bleeding risk is not high.`, recs: pick('secondary-dapt', 'secondary-rehab'), formulary: ['p2y12'] });
  if (has('aspirin')) add({ id: 'aspirin-primary', kind: c.aspirin ? 'check' : 'ok', title: c.aspirin ? 'On aspirin without ASCVD: reassess' : 'No aspirin for primary prevention', detail: c.aspirin ? 'USPSTF advises against initiation at ≥60. Weigh bleeding risk against any existing indication.' : 'USPSTF advises against initiating aspirin for primary prevention at ≥60.', recs: pick('aspirin') });

  // ---- Diabetes ------------------------------------------------------------
  if (c.diabetes) {
    if (c.a1c !== null) {
      const above = va ? c.a1c > 8.5 : c.a1c >= 7;
      const below = va && c.a1c < 7;
      const target = va ? 'VA/DoD 7.0–8.5%' : 'ADA <7%';
      const recs = [...mk('diabetes-va-a1c', 'Type 2 diabetes, VA/DoD context.'), ...mk('diabetes-ada-a1c', 'Diabetes.')];
      if (above) add({ id: 'a1c', kind: 'check', title: `A1c ${c.a1c}% above ${target}`, detail: 'Individualize by complications, comorbidity, hypoglycemia risk and life expectancy.', recs });
      else if (below) add({ id: 'a1c', kind: 'check', title: `A1c ${c.a1c}% below the VA/DoD range`, detail: 'Review hypoglycemia risk and treatment burden. VA/DoD suggests 7.0–8.5% when safely achievable.', recs });
      else add({ id: 'a1c', kind: 'ok', title: `A1c ${c.a1c}% within ${target}`, detail: '', recs });
    }
    const due = pick('ckd-diabetes-annual', 'diabetes-eye-screening', 'diabetes-foot-screening');
    if (due.length) add({ id: 'diabetes-due', kind: 'offer', title: 'Diabetes care: kidney, eye and foot screening', detail: 'Confirm each is current.', recs: due, bullets: due.map(m => m.recommendation.title) });
  }

  // ---- Screening, vaccines, counseling ------------------------------------
  const vax = pick('influenza', 'zoster', 'pneumococcal', 'hepb');
  if (vax.length) {
    const names = vax.map(m => ({ influenza: 'influenza', zoster: 'zoster (RZV)', pneumococcal: 'pneumococcal', hepb: 'hepatitis B' }[m.recommendation.rule] || m.recommendation.title));
    add({ id: 'vaccines', kind: 'offer', title: `Vaccines due: ${names.join(', ')}`, detail: 'Based on the history entered (unknown counts as not documented).', recs: vax });
  }
  const screenGroups: [string, string, string[]][] = [
    ['crc', 'Offer colorectal cancer screening', ['screen-crc-45-49', 'screen-crc-50-75', 'screen-crc-older']],
    ['lung', 'Offer lung cancer screening (low-dose CT)', ['screen-lung-ldct']],
    ['aaa', 'Offer AAA screening (ultrasound)', ['screen-aaa-ever-smoked', 'screen-aaa-never-smoked']],
    ['breast', 'Offer breast cancer screening', ['screen-breast-40-74']],
    ['cervix', 'Offer cervical cancer screening', ['screen-cervical-final']],
    ['prostate', 'Discuss PSA screening (shared decision)', ['screen-prostate-shared', 'screen-prostate-older']],
    ['bone', 'Offer osteoporosis screening', ['osteoporosis', 'osteoporosis-men']],
    ['infection', 'Infection screening: HIV, HCV, HBV', ['infection-hiv', 'infection-hcv', 'infection-hbv']]
  ];
  for (const [id, title, ids] of screenGroups) {
    const recs = pick(...ids);
    // I statements stay under "Other applicable guidance"; they are not something to offer.
    if (recs.length && !recs.every(m => m.recommendation.strength === 'I statement')) add({ id: 'screen-' + id, kind: 'offer', title, detail: recs.map(m => m.recommendation.summary).join(' ').slice(0, 220), recs });
  }
  const tobacco = pick('lifestyle-tobacco', 'lifestyle-va-combination-nrt', 'lifestyle-va-varenicline');
  if (tobacco.length) add({ id: 'tobacco', kind: 'offer', title: 'Offer tobacco cessation treatment', detail: 'Current tobacco use entered.', recs: tobacco, formulary: ['tobacco'] });
  const obesity = pick('obesity-pharmacotherapy', 'obesity-bariatric-thresholds');
  if (obesity.length) add({ id: 'obesity', kind: 'offer', title: 'Weight management options', detail: `BMI ${c.bmi}.`, recs: obesity });

  // ---- Medication review ---------------------------------------------------
  const review = pick('monitor-ace-arb', 'monitor-mra-hf', 'monitor-lipid-treatment', 'monitor-metformin-b12', 'deprescribe-ppi-review', 'deprescribe-ppi-exclusions', 'deprescribe-bzd-older', 'deprescribe-bzd-withdrawal');
  if (review.length) add({ id: 'med-review', kind: 'offer', title: 'Medication monitoring and review', detail: 'Based on the current medications entered.', recs: review, bullets: [...new Set(review.map(m => m.recommendation.title))] });

  const other = matches.filter(m => !used.has(m.recommendation.id));
  const needsInput = result.gaps.filter(g => !GENERIC_GAPS.some(re => re.test(g)));
  const order: Record<ActionKind, number> = { change: 0, start: 1, check: 2, offer: 3, ok: 4 };
  actions.sort((a, b) => order[a.kind] - order[b.kind]);
  return { actions, other, needsInput, errors: [] };
}
