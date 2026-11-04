import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {societyReview,sourceMatchesSociety,societyFilters} from './societies';
import {recommendations,sources,topics,evaluateCase,profiles,searchRecommendations,filterEvidence} from './guidelines';
import {pageForHash,workflowForPage} from './navigation';
import {topicCollections} from '../components/LibraryHome';
import {SocietyReview} from '../components/SocietyReview';
import {AboutSage} from '../components/AboutSage';
import {DataReleaseHistory} from '../components/FreshnessReview';
import history from '../data/recommendation-history.json';
import watch from '../data/watch-pages.json';
// @ts-expect-error Shared URL validator is plain JavaScript, with dedicated runtime tests.
import {assertSourceUrl} from '../../scripts/check-sources.mjs';
const expected=['ACC','AHA','HFSA','HRS','CHEST','ATS','SCCM','IDSA','ADA','AACE','Endocrine Society','ATA','KDIGO','ACG','AGA','AASLD','ASH','ASCO','NCCN','ACR','AAN','ACP','USPSTF','CDC/ACIP','GOLD','GINA','ESC','EASL','ESMO','EULAR'];
describe('society review and clinical provenance',()=>{
 it('covers exactly the requested societies, with ACR meaning Rheumatology',()=>{
  expect(societyReview.map(s=>s.acronym)).toEqual(expected);
  expect(new Set(societyReview.map(s=>s.id)).size).toBe(30);
  expect(societyReview.find(s=>s.acronym==='ACR')!.name).toBe('American College of Rheumatology');
  expect(new Set(societyFilters.map(s=>s.value)).size).toBe(societyFilters.length);
 });
 it('retains dated document-level access, version and scope rather than asserting exhaustive coverage',()=>{
  for(const s of societyReview){expect(s.checkedAt).toBe('2026-11-03');expect(s.summary).toBeTruthy();expect(s.limitations.length).toBeGreaterThan(0);expect(s.documents.length).toBeGreaterThan(0);expect(()=>assertSourceUrl(s.indexUrl)).not.toThrow();
   for(const d of s.documents){expect(d.type).toBeTruthy();expect(d.version).toBeTruthy();expect(d.access).toBeTruthy();expect(d.year).toBeLessThanOrEqual(2027);expect(()=>assertSourceUrl(d.url)).not.toThrow();expect([...watch,...sources].some(w=>w.url===d.url),d.url).toBe(true);}
  }
 });
 it('keeps all source IDs unique and every recommendation in a supported topic',()=>{
  expect(new Set(sources.map(s=>s.id)).size).toBe(sources.length);
  for(const r of recommendations)expect(topics.some(t=>t.id===r.topic),r.id).toBe(true);
 });
 it('does not invent recommendations from restricted NCCN or ESMO documents',()=>{
  for(const acronym of ['NCCN','ESMO']){expect(searchRecommendations('',undefined,acronym)).toEqual([]);expect(societyReview.find(s=>s.acronym===acronym)!.limitations.join(' ')).toMatch(/access|restrict|inspect|unverified/i);}
 });
 it('avoids acronym collisions while retaining joint-society sources',()=>{
  expect(sourceMatchesSociety({society:'SCCM / ASHP'},'ASH')).toBe(false);
  expect(sourceMatchesSociety({society:'AHA / ACC / ACCP / CHEST'},'ACP')).toBe(false);
  expect(sourceMatchesSociety({society:'AHA / ACC / HRS'},'HRS')).toBe(true);
  expect(sourceMatchesSociety({society:'CDC'},'CDC/ACIP')).toBe(true);
  expect(searchRecommendations('',undefined,'Endocrine Society').length).toBeGreaterThan(0);
 });
 it('keeps all 70 new summaries out of automatic case matching',()=>{
  expect(recommendations.filter(r=>r.referenceOnly)).toHaveLength(70);
  for(const p of profiles)expect(evaluateCase(p.data).matches.some(m=>m.recommendation.referenceOnly)).toBe(false);
 });
 it('preserves non-Class-I cardiac recommendations and native GRADE certainty',()=>{
  expect(filterEvidence(searchRecommendations('','anticoagulation'),'2a','B-NR').some(r=>r.id==='pe-2026-minor-reversible')).toBe(true);
  expect(filterEvidence(searchRecommendations('','vascular-disease'),'3-harm','C-LD').some(r=>r.id==='pad-cilostazol-hf-harm')).toBe(true);
  expect(recommendations.find(r=>r.id==='laao-oac-contraindication')!.evidenceLevel).toBeNull();
  expect(recommendations.find(r=>r.id==='laao-oac-contraindication')!.evidenceNote).toContain('Very low');
 });
 it('retains distinct ACP and USPSTF breast pathways',()=>{
  expect(searchRecommendations('','screening','ACP').some(r=>r.id==='screen-breast-acp-40-49')).toBe(true);
  expect(searchRecommendations('','screening','USPSTF').some(r=>r.id==='screen-breast-40-74')).toBe(true);
  expect(recommendations.find(r=>r.id==='screen-breast-acp-40-49')!.cautions.join(' ')).toContain('Differs from USPSTF');
 });
 it('retains the exact prior clinical/source records for deliberate replacements',()=>{
  const kidney=history.find(r=>r.recordId==='ckd-kdigo-acearb')!;
  expect(kidney.previous).toMatchObject({sourceId:'kdigo-bp-2021',revision:1});
  expect(kidney.updated).toMatchObject({sourceId:'kdigo-ckd-2024',revision:2,locator:'Recommendation 3.6.3'});
  expect(sources.find(s=>s.id==='cdc-adult-2025')!.version).toContain('amended April 27, 2026');
 });
});
describe('KDIGO 2024 ACEi/ARB matching revision',()=>{
 const base={...profiles[0].data,ckd:true,hypertensionDiagnosis:false,egfr:45,uacr:30,albuminuriaPersistent:true};
 const matches=(change={})=>evaluateCase({...base,...change}).matches.map(m=>m.recommendation.id);
 it('matches persistent albuminuric diabetic CKD without a hypertension diagnosis',()=>expect(matches()).toContain('ckd-kdigo-acearb'));
 it('includes eGFR 15 and UACR 30 boundaries',()=>expect(matches({egfr:15})).toContain('ckd-kdigo-acearb'));
 it.each([{ckd:false},{diabetes:false},{uacr:null},{uacr:29.9},{albuminuriaPersistent:false},{egfr:14.9},{dialysis:true}])('withholds the G1–G4 diabetic A2/A3 path for %j',change=>expect(matches(change)).not.toContain('ckd-kdigo-acearb'));
});
describe('library navigation and creator information',()=>{
 it('places new specialty routes and society review inside the existing library workflow',()=>{
  for(const page of ['societies',...topics.map(t=>t.id)]){expect(pageForHash('#'+page)).toBe(page);expect(workflowForPage(page)).toBe('library');}
  const listed=topicCollections.filter(c=>c.id!=='all').flatMap(c=>c.topics);
  expect(listed.sort()).toEqual(topics.map(t=>t.id).sort());expect(new Set(listed).size).toBe(topics.length);
 });
 it('renders all society identities, access limits and document links',()=>{
  const html=renderToStaticMarkup(<SocietyReview onBrowse={()=>{}}/>);
  for(const s of societyReview){expect(html).toContain(s.name);expect(html).toContain(s.indexUrl);}
  expect(html).toContain('Citation links only');expect(html).toContain('not an exhaustive extraction');
 });
 it('credits the creator with the requested personal link and plain purpose',()=>{
  const html=renderToStaticMarkup(<AboutSage/>);
  expect(html).toContain('Marc Machaalani');expect(html).toContain('href="https://marcmachaalani.github.io"');expect(html).toContain('decision engine');expect(html).toContain('guideline library');expect(html).toContain('risk calculators');expect(html).toContain('medical verification');
 });
 it('shows the previous and revised clinical rule without implying clinical approval',()=>{
  const html=renderToStaticMarkup(<DataReleaseHistory/>);expect(html).toContain('Previous bundled record');expect(html).toContain('medical review pending');expect(html).toContain('2024');
 });
});
