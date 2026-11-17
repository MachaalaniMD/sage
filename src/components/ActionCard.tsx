import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, ChevronRight } from 'lucide-react';
import { sourceFor, type Match, type Recommendation } from '../lib/guidelines';
import { formularyClasses, formularyStatusShort, resolveFormulary, type FormularyClass, type FormularyOption } from '../lib/meds';
import type { Action, ActionKind, Mode } from '../lib/plan';

const kindLabel: Record<ActionKind, string> = { change: 'Change', start: 'Start', check: 'Check', offer: 'Offer', ok: 'On track' };

let drugsPromise: Promise<{ id: string; name: string; status: string; note: string }[]> | null = null;
const loadDrugs = () => (drugsPromise ??= import('../lib/va').then(m => m.vaSnapshot.drugs));

export function useFormulary(classes: FormularyClass[] | undefined, enabled: boolean) {
  const [options, setOptions] = useState<{ cls: FormularyClass; items: FormularyOption[] }[]>([]);
  const key = (classes || []).join('|');
  useEffect(() => {
    if (!enabled || !classes?.length) { setOptions([]); return; }
    let live = true;
    loadDrugs().then(drugs => { if (live) setOptions(classes.map(cls => ({ cls, items: resolveFormulary(cls, drugs) }))); });
    return () => { live = false; };
  }, [key, enabled]);
  return options;
}

const statusClass = (s: string) => s === 'Y' ? 'fm-yes' : s.startsWith('PA') ? 'fm-pa' : 'fm-no';

function Formulary({ classes }: { classes: FormularyClass[] }) {
  const groups = useFormulary(classes, true);
  if (!groups.length) return null;
  return <div className="formulary" aria-label="VA national formulary status">
    {groups.map(g => <div className="formulary-row" key={g.cls}>
      <span className="formulary-class">{formularyClasses[g.cls].label}</span>
      <span className="formulary-items">{g.items.map(o => <a key={o.name} className={`fm-chip ${statusClass(o.status)}`} href={`https://www.va.gov/formularyadvisor/drugs/${o.id}-${encodeURIComponent(o.name)}`} target="_blank" rel="noreferrer" title={o.note || formularyStatusShort[o.status]}>
        <strong>{o.display}</strong><span>{formularyStatusShort[o.status] || o.status}</span></a>)}</span>
    </div>)}
  </div>;
}

function RecLine({ m, onOpen }: { m: Match; onOpen: (r: Recommendation) => void }) {
  const r = m.recommendation; const s = sourceFor(r);
  return <li className="why-rec">
    <div className="why-rec-top"><span className="why-society">{s.society} · {s.year}</span><span className="why-grade">{r.strength}{r.evidenceLevel ? ` · ${r.evidenceLevel}` : ''}</span></div>
    <button className="why-title" onClick={() => onOpen(r)}>{r.title}<ChevronRight size={13}/></button>
    <p>{r.summary}</p>
    {m.reason && <p className="why-reason">{m.reason}{m.context ? ` ${m.context}` : ''}</p>}
    <a href={s.url} target="_blank" rel="noreferrer">Source <ArrowUpRight size={12}/></a>
  </li>;
}

export function ActionCard({ action: a, mode, onOpen }: { action: Action; mode: Mode; onOpen: (r: Recommendation) => void }) {
  const count = a.primary.length + a.alt.length;
  return <article className={`act act-${a.kind}`}>
    <div className="act-head"><span className="act-kind">{a.kind === 'ok' && <Check size={11}/>}{kindLabel[a.kind]}</span><h3>{a.title}</h3></div>
    {a.detail && <p className="act-detail">{a.detail}</p>}
    {a.bullets && <ul className="act-bullets">{a.bullets.map(b => <li key={b}>{b}</li>)}</ul>}
    {mode === 'va' && a.formulary && a.formulary.length > 0 && <Formulary classes={a.formulary}/>}
    {count > 0 && <details className="act-why"><summary>Why · {a.primary.map(m => sourceFor(m.recommendation).society.split(' ·')[0]).filter((v, i, arr) => arr.indexOf(v) === i).join(', ')}{a.alt.length ? ` · ${a.alt.length} from ${a.altLabel || 'other societies'}` : ''}</summary>
      <ul>{a.primary.map(m => <RecLine key={m.recommendation.id} m={m} onOpen={onOpen}/>)}</ul>
      {a.alt.length > 0 && <><div className="why-alt-label">{mode === 'va' ? 'Other societies (VA/DoD leads above)' : 'Also: VA/DoD'}</div><ul className="why-alt">{a.alt.map(m => <RecLine key={m.recommendation.id} m={m} onOpen={onOpen}/>)}</ul></>}
    </details>}
  </article>;
}
