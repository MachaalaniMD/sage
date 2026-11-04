import {topics} from './guidelines';

export const workflows=[
 {id:'engine',title:'Decision engine',description:'Enter case facts and review applicable care.'},
 {id:'library',title:'Guideline library',description:'Look up a clinical question and its evidence.'},
 {id:'calculators',title:'Risk calculators',description:'Calculate risk and connect it to guidance.'}
] as const;
export type Workflow=typeof workflows[number]['id']|'home';
const pages=new Set(['home','engine','library','calculators','va','statins','cardiology','updates','sources','societies','saved',...topics.map(t=>t.id)]);
export function pageForHash(hash:string):string{
 const page=hash.replace(/^#/,'');
 if(page==='overview')return 'home';
 if(page==='areas')return 'library';
 return pages.has(page)?page:'home';
}
export function workflowForPage(page:string):Workflow{
 return page==='home'?'home':page==='engine'?'engine':page==='calculators'?'calculators':'library';
}
