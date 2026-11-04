import {useState} from 'react';
import {ArrowRight,BookOpen,Heart,ShieldCheck} from 'lucide-react';
import {topics,recommendations,type Topic} from '../lib/guidelines';
import {societyReview} from '../lib/societies';
import {topicIcons} from './Dashboard';

export function LibraryNavigation({page,navigate}:{page:string;navigate:(p:string)=>void}){
 const links=[['library','Clinical topics'],['societies','Societies & versions'],['va','VA medications & access'],['saved','Saved references'],['updates','Sources & updates']];
 return <nav className="library-navigation" aria-label="Guideline library sections">{links.map(([id,label])=><button key={id} className={page===id||id==='library'&&!['va','saved','updates','sources','societies'].includes(page)||id==='updates'&&page==='sources'?'active':''} onClick={()=>navigate(id)}>{label}</button>)}</nav>;
}
export const topicCollections:{id:string;label:string;topics:Topic[]}[]=[
 {id:'all',label:'All topics',topics:[]},
 {id:'prevention',label:'Prevention & general care',topics:['vaccinations','prevention','screening','osteoporosis','infectious-disease','cancer-surveillance','monitoring','deprescribing','referral','lifestyle']},
 {id:'cardiovascular',label:'Cardiovascular',topics:['dyslipidemia','hypertension','heart-failure','secondary-prevention','anticoagulation','vascular-disease']},
 {id:'endocrine-kidney',label:'Endocrine & kidney',topics:['diabetes','ckd','obesity','endocrine','thyroid']},
 {id:'respiratory-infection',label:'Respiratory & acute care',topics:['copd','asthma','infections','critical-care']},
 {id:'gi-liver',label:'GI & liver',topics:['gastroenterology','liver']},
 {id:'other-specialties',label:'Hematology, rheumatology & neurology',topics:['hematology','rheumatology','neurology']}
];
export function LibraryHome({navigate,onQuestion}:{navigate:(p:string)=>void;onQuestion:(q:string)=>void}){
 const [collection,setCollection]=useState('all');
 const selected=topicCollections.find(c=>c.id===collection)!;
 const visible=topics.filter(t=>collection==='all'||selected.topics.includes(t.id));
 return <div className="library-home">
  <div className="library-questions"><span>COMMON QUESTIONS</span>{['HFpEF recommendations','Statin indications & doses','Colorectal screening','Adult vaccinations'].map(q=><button key={q} onClick={()=>onQuestion(q)}>{q}<ArrowRight size={13}/></button>)}</div>
  <button className="library-review-link" onClick={()=>navigate('societies')}><BookOpen size={21}/><span><strong>{societyReview.length} societies · selected source review</strong><small>November 3, 2026 · See included guidance, versions and access limits.</small></span><ArrowRight size={17}/></button>
  <div className="section-heading"><div><h2>Browse clinical topics</h2><p>Choose a specialty or search across the library. New specialty references are not automatic engine rules.</p></div><span className="count-label">{topics.length} areas</span></div>
  <div className="topic-collections" aria-label="Filter clinical topics by specialty">{topicCollections.map(c=><button key={c.id} aria-pressed={collection===c.id} className={collection===c.id?'active':''} onClick={()=>setCollection(c.id)}>{c.label}</button>)}</div>
  <div className="library-topic-grid">{visible.map(t=>{const Icon=topicIcons[t.id];const rows=recommendations.filter(r=>r.topic===t.id);return <button className="library-topic-card" key={t.id} onClick={()=>navigate(t.id)}><span className={`topic-icon topic-${t.color}`}><Icon size={20}/></span><span><strong>{t.title}</strong><small>{t.description}</small><em>{rows.length} source-linked record{rows.length===1?'':'s'}{rows.every(r=>r.referenceOnly)?' · library reference':''}</em></span><ArrowRight size={16}/></button>;})}</div>
  <div className="library-resource-links"><button onClick={()=>navigate('va')}><ShieldCheck size={20}/><span><strong>Working in the VA?</strong><small>National formulary, criteria for use and West Haven resources.</small></span><ArrowRight size={16}/></button><button onClick={()=>navigate('cardiology')}><Heart size={20}/><span><strong>Cardiovascular collection</strong><small>Heart failure, lipids, BP, PAD and secondary prevention.</small></span><ArrowRight size={16}/></button><button onClick={()=>navigate('sources')}><BookOpen size={20}/><span><strong>Review source provenance</strong><small>Publication dates, versions and medical-review status.</small></span><ArrowRight size={16}/></button></div>
 </div>;
}
