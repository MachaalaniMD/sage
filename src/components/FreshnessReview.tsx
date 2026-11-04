import { ArrowUpRight, History, Info } from 'lucide-react';
import audit from '../data/freshness-audit.json';
import monitorRun from '../data/monitor-run.json';
import recordHistory from '../data/recommendation-history.json';
import { topics, type Topic } from '../lib/guidelines';
const statusLabels:Record<string,string>={'new-final-found':'Additional final sources found','no-new-final-found':'No newer final found in this check','draft-only':'Draft / development update','access-limited':'Source access limited'};
export function TopicFreshness({topic}:{topic:Topic}){
 const r=audit.find(r=>r.topic===topic);
 if(!r)return null;
 return <details className="topic-freshness"><summary><History size={15}/><span>Source review · {r.checkedAt} · {statusLabels[r.status]}</span></summary><div><p>{r.summary}</p><p><strong>Included / pending:</strong> {r.implementation}</p><a href="#updates">Review source findings for all clinical areas <ArrowUpRight size={12}/></a></div></details>;
}
export function FreshnessReview(){
 const [year,month,day]=audit.map(r=>r.checkedAt).sort().at(-1)!.split('-');
 return <section className="freshness-review"><div className="section-heading"><div><h2>Source review across {audit.length} clinical areas</h2><p>Most recent check {month}/{day}/{year}; each area retains its own date. Publication discovery is separate from medical verification.</p></div></div><div className="coverage-summary"><Info size={17}/><p>A bounded primary-source search was completed for every clinical area. “No newer final found” is not a guarantee of exhaustive coverage. New final sources, drafts, access limitations and implementation status stay visible below. Drafts do not replace final guidance.</p></div><div className="coverage-summary"><History size={17}/><p><strong>Latest observed automatic check · November 2, 2026:</strong> {monitorRun.summary['access-error']} source-access failures flagged, {monitorRun.summary['baseline-needed']} new observations and {monitorRun.summary.unchanged} unchanged fingerprints. No clinical recommendations were changed. This run predates the expanded v0.5 watch list. <a href={monitorRun.url} target="_blank" rel="noreferrer">Open the retained workflow report <ArrowUpRight size={12}/></a></p></div><div className="freshness-list">{topics.map(t=>{const r=audit.find(r=>r.topic===t.id)!;return <details key={r.topic}><summary><span><strong>{t.title}</strong><small>{statusLabels[r.status]} · {r.checkedAt}</small></span><ArrowUpRight size={15}/></summary><div><p>{r.summary}</p><p><strong>Included / pending:</strong> {r.implementation}</p><p><strong>Next review action:</strong> {r.proposedAction}</p>{'accessLimitations' in r&&<p><strong>Access and scope:</strong> {r.accessLimitations}</p>}<ul>{r.links.map(l=><li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.title} · {l.year} <ArrowUpRight size={12}/></a></li>)}</ul></div></details>;})}</div></section>;
}

export function DataReleaseHistory(){
 return <section className="data-release-history"><h2>Changes in this data release</h2>{recordHistory.map(r=><article className="data-revision" key={r.recordId}><span className="source-kicker">{r.recordType} revision · {r.changedAt}</span><h3>{r.title}</h3><p>{r.reason}</p><dl><div><dt>Previous bundled record</dt><dd>{r.beforeText}</dd></div><div><dt>Updated record · medical review pending</dt><dd>{r.afterText}</dd></div></dl><a href={r.sourceUrl} target="_blank" rel="noreferrer">Check primary source <ArrowUpRight size={12}/></a></article>)}</section>;
}
