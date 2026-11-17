import {topics} from './guidelines';

export type Workflow='case'|'library'|'calculators';
const pages=new Set(['case','library','calculators','va','statins','cardiology','updates','sources','societies','saved',...topics.map(t=>t.id)]);
export function pageForHash(hash:string):string{
 const page=hash.replace(/^#/,'');
 if(page==='areas')return 'library';
 return pages.has(page)?page:'case';
}
export function workflowForPage(page:string):Workflow{
 return page==='case'?'case':page==='calculators'?'calculators':'library';
}
