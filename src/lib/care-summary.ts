import {groupRecommendations} from './recommendation-groups';
import {heartFailurePhenotype,type FictionalCase,type Match} from './guidelines';

export type CareCategory='medications'|'vaccinations'|'screening'|'monitoring'|'counseling'|'other';
export const careCategories:Record<CareCategory,string>={medications:'Medication decisions',vaccinations:'Vaccinations',screening:'Screening',monitoring:'Monitoring',counseling:'Counseling',other:'Other care'};
export interface CareItem {id:string;title:string;category:CareCategory;matches:Match[];priority:number}

// Presentation groups only: eligibility and source-specific recommendations come from evaluateCase.
export function buildCareSummary(matches:Match[],c:FictionalCase):CareItem[]{
 const buckets=new Map<string,CareItem>();
 const add=(id:string,title:string,category:CareCategory,priority:number,match:Match)=>{
  let item=buckets.get(id);if(!item){item={id,title,category,priority,matches:[]};buckets.set(id,item);}item.matches.push(match);
 };
 for(const m of matches){
  const r=m.recommendation;
  if(r.strength==='I statement'){
   add('uncertain-'+r.id,r.id==='prevention-osteoporosis-men'?'Evidence insufficient: osteoporosis screening in men':`Evidence insufficient: ${r.title}`,'other',11,m);
  }else if(r.id==='prevention-aspirin'){
   add('primary-aspirin','Avoid initiating aspirin for primary prevention','medications',5,m);
  }else if(r.topic==='dyslipidemia'||r.id.startsWith('secondary-lipids')||r.id==='secondary-va-lipids'){
   const high=matches.some(m=>['lipids-diabetes-high-risk','lipids-prevent-high','secondary-lipids-standard','secondary-lipids-very-high'].includes(m.recommendation.id));
   add('lipid-care',c.statin?'Review current lipid-lowering therapy':high?'Discuss high-intensity statin therapy':'Discuss starting statin therapy','medications',1,m);
  }else if(r.topic==='vaccinations')add('vaccines','Review adult vaccinations','vaccinations',2,m);
  else if(r.id.startsWith('screen-crc-'))add('colorectal-screening',r.id==='screen-crc-older'?'Discuss individualized colorectal screening':'Discuss colorectal cancer screening','screening',3,m);
  else if(['screening','infectious-disease'].includes(r.topic))add('other-screening','Review other preventive screening','screening',5,m);
  else if(r.topic==='hypertension'||r.id.startsWith('secondary-bp-'))add('bp-care','Review blood-pressure treatment and targets','medications',4,m);
  else if(r.topic==='heart-failure'){
   const type=heartFailurePhenotype(c);const label={hfref:'HFrEF',hfpef:'HFpEF',hfmref:'HFmrEF',hfimpef:'improved-EF HF',unclassified:'heart failure',none:'heart failure'}[type];
   add('hf-care',`Review ${label} therapy and eligibility`,'medications',4,m);
  }else if(r.topic==='diabetes')add('diabetes-care','Review diabetes goals and follow-up','other',6,m);
  else if(r.topic==='ckd'||r.id==='referral-kidney')add('kidney-care','Review kidney screening and protection','monitoring',7,m);
  else if(r.topic==='monitoring')add('medication-monitoring','Plan medication monitoring','monitoring',8,m);
  else if(r.topic==='lifestyle')add('lifestyle','Discuss lifestyle and prevention','counseling',10,m);
  else{
   const group=groupRecommendations([r])[0];
   const category:CareCategory=['screening','osteoporosis','infectious-disease'].includes(r.topic)?'screening':['anticoagulation','secondary-prevention','deprescribing','obesity'].includes(r.topic)?'medications':'other';
   add(group.id,group.title,category,category==='screening'?5:9,m);
  }
 }
 return [...buckets.values()].sort((a,b)=>a.priority-b.priority);
}
