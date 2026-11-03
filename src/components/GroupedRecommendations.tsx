import { ChevronDown, Layers } from 'lucide-react';
import { groupRecommendations } from '../lib/recommendation-groups';
import { sourceFor, type Match, type Recommendation } from '../lib/guidelines';
import { RecommendationCard } from './RecommendationCard';

export function GroupedRecommendations({rows,saved,onSave,onOpen,query='',matches=[]}:{rows:Recommendation[];saved:Set<string>;onSave:(id:string)=>void;onOpen:(r:Recommendation)=>void;query?:string;matches?:Match[]}){
 const groups=groupRecommendations(rows);
 const card=(r:Recommendation)=>{const match=matches.find(m=>m.recommendation.id===r.id);return <RecommendationCard key={r.id} recommendation={r} saved={saved.has(r.id)} onSave={()=>onSave(r.id)} onOpen={()=>onOpen(r)} reason={match?.reason} context={match?.context}/>;};
 return <div className="recommendation-grid grouped-grid">{groups.map(g=>g.parent?<details key={`${g.id}-${query}`} className="recommendation-group" open={query.trim()?true:undefined}><summary><span className="group-symbol"><Layers size={19}/></span><span className="group-heading"><strong>{g.title}</strong><span>{g.description}</span><small>{g.records.length}{g.records.length<g.total?` of ${g.total}`:''} reference{g.records.length===1?'':'s'}{g.records.length<g.total?` ${g.records.length===1?'matches':'match'} the current filters`:''} · {[...new Set(g.records.map(r=>sourceFor(r).society))].join(' · ')}</small></span><ChevronDown size={18} className="group-chevron"/></summary><div className="group-records"><p className="group-grade-note">Each population keeps its own source, year, strength and evidence level. These entries are not combined into one recommendation.</p>{g.records.map(card)}</div></details>:card(g.records[0]))}</div>;
}
