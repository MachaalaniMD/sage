import snapshot from '../data/va-formulary.json';
import Fuse from 'fuse.js';
export const vaSnapshot=snapshot;
export type VaDrug=typeof snapshot.drugs[number];
export type VaStatus=VaDrug['status'];
export const statusDefinitions:Record<string,{label:string;detail:string}>={
 Y:{label:'Formulary',detail:'Listed on the national formulary. Review product restrictions and indication-specific guidance.'},
 'PA-F':{label:'Formulary · facility PA',detail:'National formulary item with prior authorization managed at facility level. Review the current Criteria for Use and contact pharmacy.'},
 'PA-V':{label:'Formulary · VISN PA',detail:'Prior authorization is managed at VISN level. Confirm the current approval pathway with pharmacy.'},
 'PA-N':{label:'Formulary · national PA',detail:'National prior authorization requirements apply. Confirm the current approval pathway with pharmacy.'},
 N:{label:'Non-formulary',detail:'Requires a non-formulary request and prior approval. Consider clinically appropriate formulary alternatives.'},
 NAP:{label:'Non-approved product',detail:'Not covered under the VA pharmacy benefit in this snapshot. Check the official record and pharmacy; do not infer a routine exception pathway.'}
};
const index=new Fuse(snapshot.drugs,{keys:[{name:'name',weight:3},{name:'synonyms',weight:3},'className','classCode'],threshold:.2,ignoreLocation:true});
export function searchVaDrugs(query:string,status='all') {
 const hits=query.trim()?index.search(query.trim()).map(r=>r.item):snapshot.drugs;
 return hits.filter(d=>status==='all'||d.status===status);
}
export const vaDrugUrl=(d:VaDrug)=>`https://www.va.gov/formularyadvisor/drugs/${d.id}-${encodeURIComponent(d.name)}`;
export function documentsForDrug(d:VaDrug){return snapshot.documents.filter(doc=>d.documentIds.includes(doc.id)).sort((a,b)=>b.revision.localeCompare(a.revision));}
