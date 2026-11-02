import { ArrowUpRight, Bookmark, ChevronRight, FileText } from 'lucide-react';
import { sourceFor, type Recommendation } from '../lib/guidelines';
export function ReviewLabel({ compact = false }: { compact?: boolean }) {
  return <span className={`review-label ${compact ? 'compact' : ''}`}><span/>Medical review required</span>;
}
export function RecommendationCard({ recommendation: r, saved, onSave, onOpen, reason, context }: {
  recommendation: Recommendation; saved: boolean; onSave: () => void; onOpen: () => void; reason?: string; context?: string;
}) {
  const source = sourceFor(r);
  return <article className="recommendation-card">
    <div className="recommendation-top"><span className="source-kicker">{source.society} <span>· {source.year}</span></span><button className={`icon-button bookmark-button ${saved ? 'is-saved' : ''}`} onClick={onSave} aria-label={`${saved ? 'Unsave' : 'Save'} ${r.title}`} aria-pressed={saved}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'}/></button></div>
    <button className="recommendation-title" onClick={onOpen}>{r.title}<ChevronRight size={18}/></button>
    <p>{r.summary}</p>
    {reason && <div className="match-reason"><span>WHY THIS MATCHED</span>{reason}{context && <em>{context}</em>}</div>}
    <div className="population"><FileText size={14}/><span>{r.population}</span></div>
    <div className="recommendation-bottom"><div className="evidence-tags"><span className={r.strength === 'Grade D' ? 'grade grade-neutral' : 'grade'}>{r.strength}</span>{r.evidenceLevel && <span className="evidence">Evidence {r.evidenceLevel}</span>}</div><ReviewLabel compact/></div>
    <div className="card-links"><button onClick={onOpen}>Evidence & details <ChevronRight size={13}/></button><a href={source.url} target="_blank" rel="noreferrer">Primary source <ArrowUpRight size={13}/></a></div>
  </article>;
}
