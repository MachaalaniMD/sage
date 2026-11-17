import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {pageForHash,workflowForPage} from './navigation';
import {LibraryHome} from '../components/LibraryHome';

describe('case-first navigation',()=>{
 it.each(['','#home','#engine','#overview','#unknown'])('opens the case screen from %s',hash=>expect(pageForHash(hash)).toBe('case'));
 it('keeps earlier topic and resource links working as reference pages',()=>{
  for(const page of ['heart-failure','va','updates','sources','statins','saved','cardiology']){expect(pageForHash('#'+page)).toBe(page);expect(workflowForPage(page)).toBe('library');}
  expect(pageForHash('#areas')).toBe('library');expect(workflowForPage('calculators')).toBe('calculators');expect(workflowForPage('case')).toBe('case');
 });
 it('offers direct library questions without requiring a case form',()=>{
  const html=renderToStaticMarkup(<LibraryHome navigate={()=>{}} onQuestion={()=>{}}/>);
  expect(html).toContain('HFpEF recommendations');expect(html).toContain('Colorectal screening');expect(html).toContain('VA');expect(html).not.toContain('<input');expect(html).not.toContain('<form');
 });
});
