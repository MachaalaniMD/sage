import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {workflows,pageForHash,workflowForPage} from './navigation';
import {buildCareSummary} from './care-summary';
import {evaluateCase,profiles,sourceFor} from './guidelines';
import {CareSummary} from '../components/CareSummary';
import {LibraryHome} from '../components/LibraryHome';

const example=profiles.find(p=>p.id==='va-visit')!.data;
const result=evaluateCase(example);
describe('three clear workflows',()=>{
 it('has exactly the three requested primary destinations',()=>expect(workflows.map(w=>w.id)).toEqual(['engine','library','calculators']));
 it.each(['','#overview','#unknown'])('opens the engine from %s',hash=>expect(pageForHash(hash)).toBe('engine'));
 it('keeps earlier topic/resource links in the library workflow',()=>{
  for(const page of ['heart-failure','va','updates','sources','statins','saved','cardiology']){expect(pageForHash('#'+page)).toBe(page);expect(workflowForPage(page)).toBe('library');}
  expect(pageForHash('#areas')).toBe('library');expect(workflowForPage('calculators')).toBe('calculators');
 });
 it('offers direct library questions without requiring a case form',()=>{
  const html=renderToStaticMarkup(<LibraryHome navigate={()=>{}} onQuestion={()=>{}}/>);
  expect(html).toContain('HFpEF recommendations');expect(html).toContain('Colorectal screening');expect(html).toContain('VA');expect(html).not.toContain('<input');expect(html).not.toContain('<form');
 });
});
describe('a VA case becomes a sourced care summary',()=>{
 it('demonstrates statin, vaccinations and colorectal screening together',()=>{
  expect(result.errors).toEqual([]);
  expect(buildCareSummary(result.matches,example).slice(0,3).map(i=>i.id)).toEqual(['lipid-care','vaccines','colorectal-screening']);
 });
 it('consolidates the ACC and VA statin indications while retaining both records',()=>{
  const item=buildCareSummary(result.matches,example).find(i=>i.id==='lipid-care')!;
  expect(item.title).toBe('Discuss starting statin therapy');expect(item.matches.map(m=>m.recommendation.id)).toEqual(expect.arrayContaining(['lipids-diabetes','va-lipids-primary']));
  expect(item.matches.every(m=>m.reason&&m.recommendation.status==='pending-medical-review')).toBe(true);
 });
 it('preserves all matching records once without changing clinical content',()=>{
  for(const p of profiles){const evaluated=evaluateCase(p.data);const items=buildCareSummary(evaluated.matches,p.data);expect(items.flatMap(i=>i.matches).map(m=>m.recommendation.id).sort()).toEqual(evaluated.matches.map(m=>m.recommendation.id).sort());}
 });
 it('describes current therapy review rather than starting a second statin',()=>{
  const c={...example,statin:true};const r=evaluateCase(c);expect(buildCareSummary(r.matches,c).find(i=>i.id==='lipid-care')!.title).toBe('Review current lipid-lowering therapy');
 });
 it('does not create a vaccination or CRC suggestion without a matching eligibility record',()=>{
  const c={...example,preventionContext:false,influenza:'complete' as const,zoster:'complete' as const,pneumococcal:'complete' as const,hepb:'complete' as const};
  expect(buildCareSummary(evaluateCase(c).matches,c).some(i=>['vaccines','colorectal-screening'].includes(i.id))).toBe(false);
 });
 it('does not turn selective screening in older adults into a blanket offer',()=>{
  const c={...example,age:80};expect(buildCareSummary(evaluateCase(c).matches,c).find(i=>i.id==='colorectal-screening')!.title).toBe('Discuss individualized colorectal screening');
 });
 it('keeps the HF treatment context specific to the case',()=>{
  for(const [id,label] of [['hf','HFrEF'],['hfpef','HFpEF']]){const c=profiles.find(p=>p.id===id)!.data;expect(buildCareSummary(evaluateCase(c).matches,c).find(i=>i.id==='hf-care')!.title).toContain(label);}
 });
 it('renders original classes, source dates, rationales and direct primary links',()=>{
  const html=renderToStaticMarkup(<CareSummary matches={result.matches} caseSnapshot={example} saved={new Set()} onSave={()=>{}} onOpen={()=>{}} onLibrary={()=>{}} onVa={()=>{}}/>);
  expect(html).toContain('Why this applies');expect(html).toContain('Why &amp; guidelines');expect(html).toContain('VA medications &amp; access');
  for(const m of result.matches){const source=sourceFor(m.recommendation);expect(html).toContain(source.url);expect(html).toContain(String(source.year));expect(html).toContain(m.recommendation.strength);}
 });
});
