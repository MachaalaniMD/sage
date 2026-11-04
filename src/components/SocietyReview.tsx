import { useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, ChevronDown, Search } from 'lucide-react';
import { recommendations, sourceFor } from '../lib/guidelines';
import { societyReview, societyReviewDate, sourceMatchesSociety } from '../lib/societies';

export function SocietyReview({ onBrowse }: { onBrowse: (society: string) => void }) {
  const [query, setQuery] = useState('');
  const [view, setView] = useState('all');
  const rows = societyReview.map(s => ({ ...s, count: recommendations.filter(r => sourceMatchesSociety(sourceFor(r), s.acronym)).length }));
  const visible = rows.filter(s => (!query.trim() || [s.acronym, s.name, s.summary, ...s.documents.map(d => d.title)].join(' ').toLowerCase().includes(query.trim().toLowerCase())) && (view === 'all' || (view === 'summaries' ? s.count > 0 : s.count === 0)));
  return <div className="society-review page-enter">
    <div className="page-heading"><div className="eyebrow">02 / GUIDELINE LIBRARY</div><h1>Societies & guideline versions</h1><p>A dated review of selected guidance from {societyReview.length} organizations, with publication status and access limits kept visible.</p></div>
    <div className="society-review-intro"><BookOpen size={24}/><div><strong>Source review · November 3, 2026</strong><p>This is a bounded review of official indexes and selected documents. It is not an exhaustive extraction of every society guideline. All clinical summaries await medical verification. New library references do not automatically become decision-engine rules.</p></div></div>
    <div className="society-review-toolbar"><label className="library-search"><Search size={18}/><input aria-label="Search societies and reviewed documents" placeholder="Search a society, condition or document…" value={query} onChange={e => setQuery(e.target.value)}/></label><label><span className="sr-only">Filter society coverage</span><select aria-label="Filter society coverage" value={view} onChange={e => setView(e.target.value)}><option value="all">All reviewed societies</option><option value="summaries">With library summaries</option><option value="links">Citation links only</option></select></label></div>
    <p className="society-results-count">{visible.length} organization{visible.length === 1 ? '' : 's'} · checked {societyReviewDate}</p>
    <div className="society-review-grid">{visible.map(s => <article className="society-review-card" key={s.id}>
      <div className="society-review-card-top"><span>{s.acronym}</span><small>{s.count ? `${s.count} linked reference${s.count === 1 ? '' : 's'}` : 'Citation links only'}</small></div><h2>{s.name}</h2><p>{s.summary}</p>
      <details className="society-documents"><summary>Reviewed documents <span>{s.documents.length}<ChevronDown size={14}/></span></summary><div>{s.documents.map(d => <section key={`${d.url}-${d.version}`}><span className="document-kind">{d.type} · {d.year}</span><a href={d.url} target="_blank" rel="noreferrer">{d.title} <ArrowUpRight size={13}/></a><p>{d.version}</p><small>{d.access}</small></section>)}</div></details>
      <details className="society-limitations"><summary>Scope & limitations <ChevronDown size={14}/></summary><ul>{s.limitations.map(l => <li key={l}>{l}</li>)}</ul></details>
      <div className="society-card-actions">{s.count > 0 && <button onClick={() => onBrowse(s.acronym)}>Browse references <ArrowRight size={13}/></button>}<a href={s.indexUrl} target="_blank" rel="noreferrer">Official index <ArrowUpRight size={13}/></a></div>
    </article>)}</div>
    {!visible.length && <div className="no-results"><h2>No matching societies</h2><p>Try the full society name, its acronym, or a condition.</p><button onClick={() => { setQuery(''); setView('all'); }}>Clear filters</button></div>}
  </div>;
}
