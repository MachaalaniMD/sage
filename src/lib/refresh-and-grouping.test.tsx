import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import audit from '../data/freshness-audit.json';
import watch from '../data/watch-pages.json';
// @ts-expect-error The monitor is plain JavaScript without declarations; its runtime validator is tested here.
import {assertSourceUrl} from '../../scripts/check-sources.mjs';
import {recommendations,sources,topics,searchRecommendations,filterEvidence,evaluateCase,profiles} from './guidelines';
import {recommendationGroups,groupRecommendations} from './recommendation-groups';
import {statinIntensities,hasStatinReference,mentionedStatinIntensity} from './statins';
import {GroupedRecommendations} from '../components/GroupedRecommendations';
import {StatinReference} from '../components/StatinReference';

describe('statin intensity reference',()=>{
 it('pairs the common high-intensity doses with the expected percent reduction',()=>{
  const row=statinIntensities.find(r=>r.id==='high')!;
  expect(row.ldlReduction).toBe('≥50%');
  expect(row.drugs).toEqual([{name:'Atorvastatin',dose:'40 or 80 mg once daily'},{name:'Rosuvastatin',dose:'20 or 40 mg once daily'}]);
 });
 it('keeps moderate rosuvastatin/atorvastatin distinct from high intensity',()=>{
  const row=statinIntensities.find(r=>r.id==='moderate')!;
  expect(row.drugs.find(d=>d.name==='Rosuvastatin')!.dose).toBe('5 or 10 mg once daily');
  expect(row.drugs.find(d=>d.name==='Atorvastatin')!.dose).toBe('10 or 20 mg once daily');
  expect(row.ldlReduction).toBe('30–49%');
 });
 it('has low-intensity options and never presents simvastatin 80 mg as an initiation option',()=>{
  expect(statinIntensities.find(r=>r.id==='low')!.drugs.find(d=>d.name==='Pravastatin')!.dose).toBe('10 or 20 mg once daily');
  expect(statinIntensities.flatMap(r=>r.drugs).filter(d=>d.name==='Simvastatin').some(d=>d.dose.includes('80'))).toBe(false);
 });
 it('does not equate maximally tolerated statin with high intensity',()=>{
  const r=recommendations.find(r=>r.id==='secondary-lipids-add-on')!;
  expect(hasStatinReference(r)).toBe(true);expect(mentionedStatinIntensity(r)).toBe('multiple');
  expect(mentionedStatinIntensity(recommendations.find(r=>r.id==='lipids-diabetes')!)).toBe('moderate');
 });
 it('makes every statin-intensity recommendation carry the explanatory reference',()=>{
  const rows=recommendations.filter(r=>/intensity statin/i.test(r.summary));expect(rows.length).toBeGreaterThan(5);
  for(const r of rows)expect(hasStatinReference(r),r.id).toBe(true);
  for(const dose of statinIntensities){expect(sources.find(s=>s.id===dose.sourceId)).toBeDefined();expect(dose.locator).toContain('Table 6');}
 });
 it('supports medication-name search without assigning unrelated recommendations a statin dose',()=>{
  expect(searchRecommendations('rosuvastatin').some(r=>r.id==='lipids-diabetes')).toBe(true);
  expect(hasStatinReference(recommendations.find(r=>r.id==='hf-beta')!)).toBe(false);
 });
});
describe('parent entries preserve clinical records',()=>{
 it('assigns each explicitly grouped record once and keeps every configured ID valid',()=>{
  const ids=recommendationGroups.flatMap(g=>g.recordIds);expect(new Set(ids).size).toBe(ids.length);
  for(const id of ids)expect(recommendations.some(r=>r.id===id),id).toBe(true);
 });
 it('does not drop, duplicate or mutate records during grouping',()=>{
  const before=JSON.stringify(recommendations);const flattened=groupRecommendations(recommendations).flatMap(g=>g.records);
  expect(flattened.map(r=>r.id).sort()).toEqual(recommendations.map(r=>r.id).sort());expect(JSON.stringify(recommendations)).toBe(before);
 });
 it('has one colorectal screening parent with the three original age bands and separate ACS options',()=>{
  const crc=groupRecommendations(recommendations).find(g=>g.id==='colorectal-screening')!;
  expect(crc.title).toBe('Colorectal screening');expect(crc.records).toHaveLength(5);
  for(const [id,grade] of [['screen-crc-45-49','Grade B'],['screen-crc-50-75','Grade A'],['screen-crc-older','Grade C']])expect(crc.records.find(r=>r.id===id)!.strength).toBe(grade);
  expect(crc.records.filter(r=>r.sourceId==='acs-crc-2026').every(r=>r.evidenceLevel===null)).toBe(true);
 });
 it('groups after society/evidence filtering without restoring excluded records',()=>{
  const hits=filterEvidence(searchRecommendations('','heart-failure','ACC'),'2a','B-R');
  const rows=groupRecommendations(hits).flatMap(g=>g.records);
  expect(rows).toEqual(expect.arrayContaining(hits));expect(rows).toHaveLength(hits.length);
  expect(rows.every(r=>r.strength==='Class 2a'&&r.evidenceLevel==='B-R')).toBe(true);
  const uspstf=groupRecommendations(searchRecommendations('','screening','USPSTF')).find(g=>g.id==='colorectal-screening')!;
  expect(uspstf.records).toHaveLength(3);expect(uspstf.records.every(r=>r.sourceId==='uspstf-crc-2021')).toBe(true);
 });
 it.each([[45,'screen-crc-45-49'],[50,'screen-crc-50-75'],[76,'screen-crc-older']])('retains only the matching colorectal age pathway at %i', (age,id)=>{
  const result=evaluateCase({...profiles[0].data,age:Number(age),preventionContext:true});
  const crc=groupRecommendations(result.matches.map(m=>m.recommendation)).find(g=>g.id==='colorectal-screening')!;
  expect(crc.records.map(r=>r.id)).toEqual([id]);
 });
 it('keeps screening separate from surveillance and preserves saved subsets',()=>{
  const g=groupRecommendations(recommendations.filter(r=>['screen-crc-50-75','surveillance-after-crc'].includes(r.id)));
  expect(g).toHaveLength(2);expect(g[0].records).toHaveLength(1);
  expect(groupRecommendations([])).toEqual([]);
 });
 it('renders the parent disclosure while retaining every child source and individual save control',()=>{
  const rows=recommendations.filter(r=>r.id.startsWith('screen-crc-'));
  const html=renderToStaticMarkup(<GroupedRecommendations rows={rows} saved={new Set()} onSave={()=>{}} onOpen={()=>{}}/>);
  expect(html).toContain('Colorectal screening');expect(html.match(/class="recommendation-group"/g)).toHaveLength(1);
  for(const r of rows){expect(html).toContain(r.title);expect(html).toContain(sources.find(s=>s.id===r.sourceId)!.url);}
 });
});
describe('2026 source review and attribution',()=>{
 it('reviews all 18 areas once with primary links and explicit implementation status',()=>{
  expect(audit.map(r=>r.topic).sort()).toEqual(topics.map(t=>t.id).sort());
  for(const r of audit){expect(r.checkedAt).toBe('2026-11-02');expect(r.implementation.length).toBeGreaterThan(10);expect(r.links.length).toBeGreaterThan(0);for(const link of r.links)expect(()=>assertSourceUrl(link.url)).not.toThrow();}
 });
 it('keeps discovery IDs unique and all watched links within the reviewed primary-domain allowlist',()=>{
  expect(new Set(watch.map(r=>r.id)).size).toBe(watch.length);for(const r of watch)expect(()=>assertSourceUrl(r.url),r.id).not.toThrow();
 });
 it('does not promote draft KDIGO documents into clinical recommendation sources',()=>{
  expect(audit.find(r=>r.topic==='ckd')!.summary).toContain('draft');
  expect(recommendations.some(r=>/kdigo.*2027/i.test(r.sourceId))).toBe(false);
 });
 it('keeps the two universal definitions and HFSA statement ungraded and outside automatic diagnosis',()=>{
  for(const id of ['hf-definition-universal-2026','mi-definition-universal-2026','hfmr-hfsa-2026-framework']){
   const r=recommendations.find(r=>r.id===id)!;expect(r.evidenceLevel).toBeNull();expect(r.gradeSystem).not.toContain('COR / LOE');
  }
  expect(recommendations.find(r=>r.id==='hf-definition-universal-2026')!.cautions.join(' ')).toContain('2022 treatment');
 });
 it('does not present the ACS blood-test coverage interval as a screening recommendation',()=>{
  const r=recommendations.find(r=>r.id==='screen-crc-acs2026-blood-conditional')!;
  expect(r.summary).not.toContain('3-year');expect(r.cautions.join(' ')).toContain('optimal interval unestablished');
 });
 it('adds VA tobacco matches only for current use with VA context, preserving original GRADE strength',()=>{
  const run=(veteran:boolean,smoker:boolean)=>evaluateCase({...profiles[0].data,veteran,smoker}).matches.map(m=>m.recommendation.id);
  expect(run(true,true)).toContain('lifestyle-va-varenicline');expect(run(false,true)).not.toContain('lifestyle-va-varenicline');expect(run(true,false)).not.toContain('lifestyle-va-varenicline');
  expect(recommendations.find(r=>r.id==='lifestyle-va-varenicline')!.strength).toBe('Strong for');
 });
 it('renders the statin table with its source and maximum-tolerated distinction',()=>{
  const html=renderToStaticMarkup(<StatinReference standalone/>);expect(html).toContain('Rosuvastatin');expect(html).toContain('20 or 40 mg once daily');expect(html).toContain('Table 6');expect(html).toContain('Maximally tolerated');
 });
});
