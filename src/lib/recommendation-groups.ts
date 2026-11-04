import originalGroups from '../data/recommendation-groups.json';
import societyGroups from '../data/society-groups.json';
import type { Recommendation } from './guidelines';

const groupData=[...originalGroups,...societyGroups];
export const recommendationGroups=groupData;
export interface RecommendationGroup {id:string;title:string;description:string;records:Recommendation[];parent:boolean;total:number}
const parentById=new Map(groupData.flatMap(g=>g.recordIds.map(id=>[id,g] as const)));
// Group only the already-filtered records. Never pull excluded populations or sources back in.
export function groupRecommendations(rows:Recommendation[]):RecommendationGroup[]{
 const groups=new Map<string,RecommendationGroup>();
 for(const r of rows){
  const parent=parentById.get(r.id);const id=parent?.id||r.id;
  let group=groups.get(id);
  if(!group){group={id,title:parent?.title||r.title,description:parent?.description||'',records:[],parent:!!parent,total:parent?.recordIds.length||1};groups.set(id,group);}
  group.records.push(r);
 }
 return [...groups.values()];
}
