import { describe,it,expect } from 'vitest';
import {buildVaSnapshot} from './import-va-formulary.mjs';
const d={refVUID:'123',UniqueProductName:'EXAMPLE TAB',formularyFlag:'PA-F',doc_id:['1','2'],UCformulary:'N'};
const docs=[{doc_id:'1',Description:'Current criteria',doctype:'CFU',rev_date:'2026-04',pdf_file:'current.pdf'},{doc_id:'2',Description:'Old criteria',doctype:'CFU',rev_date:'2024-01',pdf_file:'old.pdf',archived:'2026-04'}];
const versions=[{item:'Last Formulary Data Refresh',data:'10/29/2026'}];
const build=(rows=[d],records=docs,v=versions)=>buildVaSnapshot(rows,records,v,{checkedAt:'2026-11-01'});
describe('VA formulary snapshot promotion safeguards',()=>{
 it('preserves source flags and only links active documents',()=>{const r=build();expect(r.drugs[0].status).toBe('PA-F');expect(r.drugs[0].documentIds).toEqual(['1']);expect(r.drugs[0].unavailableDocumentIds).toEqual(['2']);expect(r.documents).toHaveLength(1);});
 it('preserves repeated VUID rows rather than discarding restriction notes',()=>{const r=build([d,{...d,Note:'Restricted provider'}]);expect(r.drugs).toHaveLength(2);expect(new Set(r.drugs.map(x=>x.key)).size).toBe(2);expect(r.drugs[1].note).toBe('Restricted provider');});
 it('rejects an unrecognized status instead of inventing a formulary designation',()=>expect(()=>build([{...d,formularyFlag:'NEW'}])).toThrow());
 it.each(['../private.pdf','https://example.com/file.pdf','x.html'])('rejects unsafe document filename %s',pdf_file=>expect(()=>build([d],[{...docs[0],pdf_file}])).toThrow());
 it('requires a source refresh date',()=>expect(()=>build([d],docs,[])).toThrow());
 it('marks imported data as unverified and retains historical refresh date',()=>{expect(build().metadata.status).toBe('pending-medical-review');expect(build().metadata.sourceRefresh).toBe('10/29/2026');});
});
