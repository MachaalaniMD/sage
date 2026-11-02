import { describe, expect, it } from 'vitest';
import { assertSourceUrl, initializeMissingBaselines, normalizeHtml, runChecks } from './check-sources.mjs';

const entry = { id: 'cdc-test', title: 'Test source', url: 'https://www.cdc.gov/example', kind: 'source' };
const html = '<main><h1>A fictional source fixture</h1><p>' + 'Stable test-only text. '.repeat(15) + '</p></main>';
const response = (body = html) => async () => new Response(body, { headers: { 'content-type': 'text/html' } });
describe('source monitor review workflow', () => {
  it('records a missing baseline without claiming a guideline changed', async () => {
    const report = await runChecks({ entries: [entry], fetcher: response() });
    expect(report.results[0].status).toBe('baseline-needed');
    expect(report.clinicalDataModified).toBe(false);
  });
  it('finds stable sources after initial baseline capture', async () => {
    const report = await runChecks({ entries: [entry], fetcher: response() });
    const baseline = initializeMissingBaselines({}, report);
    const next = await runChecks({ entries: [entry], baseline, fetcher: response() });
    expect(next.results[0].status).toBe('unchanged'); expect(next.needsReview).toBe(false);
  });
  it('flags changed content and never advances an existing baseline', async () => {
    const baseline = initializeMissingBaselines({}, await runChecks({ entries: [entry], fetcher: response() }));
    const before = JSON.stringify(baseline);
    const changed = await runChecks({ entries: [entry], baseline, fetcher: response(html.replace('Stable', 'Changed')) });
    expect(changed.results[0].status).toBe('changed-review-required');
    expect(changed.needsReview).toBe(true);
    expect(initializeMissingBaselines(baseline, changed)).toEqual(baseline);
    expect(JSON.stringify(baseline)).toBe(before);
  });
  it('does not interpret an access failure as unchanged', async () => {
    const report = await runChecks({ entries: [entry], fetcher: async () => new Response('Forbidden', { status: 403 }) });
    expect(report.results[0].status).toBe('access-error'); expect(report.needsReview).toBe(true);
    expect(initializeMissingBaselines({}, report)).toEqual({});
  });
  it('does not accept challenge or empty responses as guideline content', async () => {
    const report = await runChecks({ entries: [entry], fetcher: response('Just a moment. Verify you are human. ' + 'x'.repeat(200)) });
    expect(report.results[0].status).toBe('access-error');
  });
  it('does not accept an HTML response disguised as a PDF', async () => {
    const report = await runChecks({ entries: [entry], fetcher: async () => new Response(html, { headers: { 'content-type': 'application/pdf' } }) });
    expect(report.results[0].status).toBe('access-error');
  });
  it('hashes real PDF fixture bytes without fetching references embedded in them', async () => {
    const report = await runChecks({ entries: [entry], fetcher: async () => new Response('%PDF-1.7\n' + 'Synthetic fixture bytes. '.repeat(20), { headers: { 'content-type': 'application/pdf' } }) });
    expect(report.results[0].format).toBe('pdf-sha256');
    expect(report.results[0].fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });
  it('rejects arbitrary destinations and redirects', async () => {
    expect(() => assertSourceUrl('http://www.cdc.gov/')).toThrow();
    expect(() => assertSourceUrl('https://example.com/')).toThrow();
    expect(() => assertSourceUrl('https://user:pass@www.cdc.gov/')).toThrow();
    const report = await runChecks({ entries: [entry], fetcher: async () => new Response(null, { status: 302, headers: { location: 'https://example.com/unexpected' } }) });
    expect(report.results[0].status).toBe('access-error');
  });
  it('detects a source URL replacement even if the text happens to be unchanged', async () => {
    const baseline = initializeMissingBaselines({}, await runChecks({ entries: [entry], fetcher: response() }));
    const report = await runChecks({ entries: [{ ...entry, url: 'https://www.cdc.gov/replacement' }], baseline, fetcher: response() });
    expect(report.results[0].status).toBe('baseline-mismatch');
  });
  it('ignores scripts, styles and navigation outside main content', () => {
    expect(normalizeHtml('<nav>Noise</nav><main><style>body{color:red}</style><script>track()</script>Hello    world</main>')).toBe('Hello world');
  });
});
