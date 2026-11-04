import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const allowedHosts = new Set(['ascopubs.org','ashpublications.org','assets.contentstack.io','easl.eu','gi.org','ginasthma.org','goldcopd.org','journals.sagepub.com','pro.aace.com','rheumatology.org','sccm.org','www.aan.com','www.aasld.org','www.acc.org','www.chestnet.org','www.endocrine.org','www.esmo.org','www.eular.org','www.hematology.org','www.hrsonline.org','www.idsociety.org','www.nccn.org','www.neurology.org','www.thyroid.org','tools.acc.org','www.escardio.org','www.hfsa.org','hfsa.org','acsjournals.onlinelibrary.wiley.com','www.cancer.org','www.acog.org','www.hrsa.gov','www.asccp.org','www.acponline.org','professional.diabetes.org','www.asam.org','odphp.health.gov','prodweb02.chestnet.org','dailymed.nlm.nih.gov','www.jacc.org','academic.oup.com','www.accessdata.fda.gov','www.dailymed.nlm.nih.gov','www.fraxplus.org','fraxplus.org','www.va.gov','va.gov','www.pbm.va.gov','pbm.va.gov','department.va.gov','kdigo.org','diabetesjournals.org','doi.org','www.asge.org','asmbs.org','journal.chestnet.org','gastro.org','downloads.asam.org','www.acpjournals.org','journals.lww.com','pmc.ncbi.nlm.nih.gov', 'www.cdc.gov', 'cdc.gov', 'www.ahajournals.org', 'ahajournals.org', 'www.heart.org', 'heart.org', 'professional.heart.org', 'healthquality.va.gov', 'www.healthquality.va.gov', 'www.uspreventiveservicestaskforce.org', 'uspreventiveservicestaskforce.org']);
export function assertSourceUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname) || url.username || url.password || url.port) throw new Error('Source URL is outside the maintained primary-source allowlist.');
  return url;
}
export function normalizeHtml(html) {
  // Prefer main content so common navigation changes generate fewer false alarms.
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || html;
  return main.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&#160;|&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
async function fetchSource(value, fetcher) {
  let url = assertSourceUrl(value);
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetcher(url.href, { redirect: 'manual', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'SagePrototypeSourceMonitor/0.1 (guideline change review; no clinical data)' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirect missing a Location header.');
      url = assertSourceUrl(new URL(location, url).href); continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}; source access requires review.`);
    const type = (response.headers.get('content-type') || '').toLowerCase();
    if (type.includes('application/pdf')) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength < 100 || new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new Error('Expected PDF; received an unexpected response.');
      return { fingerprint: createHash('sha256').update(bytes).digest('hex'), format: 'pdf-sha256', finalUrl: url.href };
    }
    if (!type.includes('text/html')) throw new Error(`Unsupported source content type: ${type || 'missing'}.`);
    const text = normalizeHtml(await response.text());
    if (text.length < 100 || /just a moment|verify (you are|that you are) human|enable javascript and cookies|access denied|captcha/i.test(text.slice(0, 300))) throw new Error('Source content unavailable or access challenge detected.');
    return { fingerprint: createHash('sha256').update(text).digest('hex'), format: 'normalized-main-text-sha256', finalUrl: url.href };
  }
  throw new Error('Too many source redirects.');
}
export async function runChecks({ entries, baseline = {}, fetcher = fetch, checkedAt = new Date().toISOString() }) {
  const results = [];
  // Sequential and bounded: respect source services and make failures explicit.
  for (const entry of entries) {
    try {
      const observation = await fetchSource(entry.url, fetcher);
      const previous = baseline[entry.id];
      const status = !previous ? 'baseline-needed' : previous.url !== entry.url || previous.format !== observation.format ? 'baseline-mismatch' : previous.fingerprint === observation.fingerprint ? 'unchanged' : 'changed-review-required';
      results.push({ id: entry.id, title: entry.title, url: entry.url, kind: entry.kind || 'source', status, ...observation, checkedAt });
    } catch (error) {
      results.push({ id: entry.id, title: entry.title, url: entry.url, kind: entry.kind || 'source', status: 'access-error', error: error.message, checkedAt });
    }
  }
  return { checkedAt, clinicalDataModified: false, results, needsReview: results.some(r => r.status !== 'unchanged'), summary: Object.fromEntries([...new Set(results.map(r => r.status))].map(s => [s, results.filter(r => r.status === s).length])) };
}
export function initializeMissingBaselines(baseline, report) {
  const next = structuredClone(baseline);
  for (const r of report.results) {
    if (r.status === 'baseline-needed') next[r.id] = { url: r.url, fingerprint: r.fingerprint, format: r.format, recordedAt: r.checkedAt };
  }
  return next; // Existing fingerprints are never advanced automatically.
}
const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const arg = name => { const at = process.argv.indexOf(name); return at >= 0 ? process.argv[at + 1] : null; };
  const baselineFile = resolve(root, arg('--baseline-file') || 'src/data/source-fingerprints.json');
  const reportFile = resolve(root, arg('--report') || 'source-check-results.json');
  const sourceFiles=(await readdir(resolve(root,'src/data'))).filter(n=>n==='sources.json'||n.endsWith('-sources.json'));
  const sourceEntries=(await Promise.all(sourceFiles.map(n=>readFile(resolve(root,'src/data',n),'utf8').then(JSON.parse)))).flat();
  const watchEntries = JSON.parse(await readFile(resolve(root, 'src/data/watch-pages.json'), 'utf8'));
  let baseline = {};
  try { baseline = JSON.parse(await readFile(baselineFile, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const report = await runChecks({ entries: [...sourceEntries, ...watchEntries], baseline });
  await mkdir(dirname(reportFile), { recursive: true });
  await writeFile(reportFile, JSON.stringify(report, null, 2) + '\n');
  if (process.argv.includes('--baseline') || process.argv.includes('--initialize-missing')) {
    await mkdir(dirname(baselineFile), { recursive: true });
    await writeFile(baselineFile, JSON.stringify(initializeMissingBaselines(baseline, report), null, 2) + '\n');
  }
  console.log(JSON.stringify({ report: reportFile, summary: report.summary, clinicalDataModified: false }, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = ['## Sage source review', '', 'No clinical recommendation data was modified.', '', '| Source | Result |', '|---|---|', ...report.results.map(r => `| ${r.title.replaceAll('|', '/')} | ${r.status} |`), '', 'Changed source fingerprints, new publications, and access failures require human review. A text change is not proof of a clinical change.'];
    await writeFile(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n', { flag: 'a' });
  }
  // Failures stay prominent in scheduled checks; reports are still uploaded with always().
  if (report.results.some(r => r.status === 'access-error')) process.exitCode = 2;
  else if (report.results.some(r => ['changed-review-required', 'baseline-mismatch'].includes(r.status))) process.exitCode = 1;
}
