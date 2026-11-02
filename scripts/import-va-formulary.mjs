import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const vaUrls = {
  drugs:'https://www.va.gov/formularyadvisor/VANF.json',
  documents:'https://www.va.gov/formularyadvisor/DOC.json',
  versions:'https://www.va.gov/formularyadvisor/VERSIONS.json'
};
const flags=new Set(['Y','N','PA-F','PA-V','PA-N','NAP']);
export function buildVaSnapshot(drugs,documents,versions,{checkedAt,hashes={}}) {
  if(!Array.isArray(drugs)||!drugs.length||!Array.isArray(documents)||!Array.isArray(versions))throw Error('Invalid VA dataset shape');
  const active=documents.filter(d=>!d.archived);
  const ids=new Set(active.map(d=>String(d.doc_id)));
  if(ids.size!==active.length)throw Error('Duplicate VA document ID');
  const mapped=active.map(d=>{
    if(!/^[^/\\]+\.pdf$/i.test(d.pdf_file)||d.pdf_file.includes('..'))throw Error('Unsafe VA document filename');
    return {id:String(d.doc_id),title:String(d.Description).replace(/\s+/g,' ').trim(),type:String(d.doctype),revision:String(d.rev_date),url:'https://www.va.gov/formularyadvisor/DOC_PDF/'+encodeURIComponent(d.pdf_file)};
  });
  const rows=drugs.map((d,index)=>{
    if(!/^\d+$/.test(d.refVUID)||!d.UniqueProductName||!flags.has(d.formularyFlag))throw Error('Invalid or unrecognized VA drug row/status');
    const references=(d.doc_id||[]).map(String);
    return {key:`${d.refVUID}-${index}`,id:String(d.refVUID),name:String(d.UniqueProductName),synonyms:String(d.SYNONYMS||'').trim(),status:d.formularyFlag,className:String(d.ClassDesc||''),classCode:String(d.ClassCode||''),note:String(d.Note||''),urgent:d.UCformulary==='Y',documentIds:references.filter(id=>ids.has(id)),unavailableDocumentIds:references.filter(id=>!ids.has(id))};
  });
  const refresh=versions.find(v=>v.item==='Last Formulary Data Refresh')?.data;
  if(!/^\d{2}\/\d{2}\/\d{4}$/.test(refresh||''))throw Error('VA refresh date is missing');
  return {metadata:{society:'VA Pharmacy Benefits Management',checkedAt,sourceRefresh:refresh,sourceUrls:vaUrls,sha256:hashes,sourceRows:drugs.length,activeDocuments:mapped.length,archivedDocumentsExcluded:documents.length-active.length,revision:1,status:'pending-medical-review',note:'Source rows are preserved, including repeated VUIDs with different classes or notes. National status is not a local stock or individual approval decision.'},drugs:rows,documents:mapped};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const at=process.argv.indexOf('--from-directory');
  const dir=at>=0?process.argv[at+1]:null;
  const names={drugs:'va-vanf-original.json',documents:'va-doc.json',versions:'va-versions.json'};
  const texts=await Promise.all(Object.keys(vaUrls).map(async k=>[k,dir?await readFile(resolve(dir,names[k]),'utf8'):await (async()=>{const r=await fetch(vaUrls[k]);if(!r.ok)throw Error(`VA ${k}: HTTP ${r.status}`);return r.text();})()]));
  const raw=Object.fromEntries(texts);
  const checkedAt=process.env.SAGE_REVIEW_DATE||new Date().toISOString().slice(0,10);
  const candidate=buildVaSnapshot(JSON.parse(raw.drugs),JSON.parse(raw.documents),JSON.parse(raw.versions),{checkedAt,hashes:Object.fromEntries(texts.map(([k,v])=>[k,createHash('sha256').update(v).digest('hex')]))});
  // A download creates a proposal only. A reviewed commit promotes it into src/data.
  const out=resolve('.source-monitor/va-formulary-proposal.json');
  await mkdir(resolve('.source-monitor'),{recursive:true});
  await writeFile(out,JSON.stringify(candidate)+'\n');
  console.log(JSON.stringify({proposal:out,rows:candidate.drugs.length,activeDocuments:candidate.documents.length,sourceRefresh:candidate.metadata.sourceRefresh,activeDataModified:false}));
}
