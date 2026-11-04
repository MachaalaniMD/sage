import {topics} from './guidelines';

export const workflows=[
 {id:'engine',title:'Decision engine',description:'Enter case facts and review applicable care.'},
 {id:'library',title:'Guideline library',description:'Look up a clinical question and its evidence.'},
 {id:'calculators',title:'Risk calculators',description:'Calculate risk and connect it to guidance.'}
] as const;
export type Workflow=typeof workflows[number]['id'];
const pages=new Set(['engine','library','calculators','va','statins','cardiology','updates','sources','saved',...topics.map(t=>t.id)]);
export function pageForHash(hash:string):string{
 const page=hash.replace(/^#/,'');
 if(page==='overview')return 'engine';
 if(page==='areas')return 'library';
 return pages.has(page)?page:'engine';
}
export function workflowForPage(page:string):Workflow{
 return page==='engine'?'engine':page==='calculators'?'calculators':'library';
}
