# Prototype validation — November 2, 2026

This records software checks, not clinical approval. Every clinical recommendation, comparison, and dose remains pending independent medical verification.

## Automated checks

- 211 Vitest tests passed: 22 statin/grouping/source-refresh and render checks, 66 core rule/provenance tests, 28 HF/grade/dose tests, 17 expansion/VA tests, 34 PREVENT tests, 25 other risk-tool tests, 11 monitor tests and 8 VA importer tests.
- PREVENT matches all 12 original spreadsheet outputs (sex × endpoint × horizon) within 1e-12, plus the primary paper’s rounded worked examples.
- Post-MI tests cover ASCVD implication, explicit risk classification, lipid thresholds, ACS/CCD timing, bleeding/OAC exclusions and first-event score withholding.
- TypeScript checking and the Vite production build passed.
- The `/sage/` repository-subpath build emitted scoped asset URLs, manifest start URL and service-worker scope.
- The PWA build includes 192px and 512px icons and a precached static snapshot. Case values are not persisted or cached.
- Standalone packaging embeds the application and CSS, disables service-worker registration, and checks for leftover external application assets.

## Browser checks completed

- Dashboard, library search, combined VA/DoD filtering, recommendation details, and direct source links.
- Bookmark saved to the reference desk; a browser reload cleared it.
- Fictional diabetes case generated traceable matches with explicit matching reasons.
- Fictional HFrEF case matched all four pillars. Changing eGFR to 30 withheld MRA and exposed the coverage explanation.
- The heart-failure library displayed all eight dose-table entries with source locators.
- The 2018 → 2026 ACC/AHA comparison displayed the before/after summary and pending-review label.
- Phone navigation at 390 × 844 and desktop layout at 1440 × 1000. A decorative overflow and unwanted navigation scroll were fixed; the 390px dashboard then had no horizontal page overflow.
- Production app loaded successfully at `/sage/` with no console errors in that session.
- The production app reported its bundled snapshot ready offline. After both local servers were stopped, a reload succeeded and the fictional age-58 vaccine case still generated all four encoded vaccination references.

## v0.2 browser checks

- Dedicated PREVENT calculator displays the published female example: 14.7% total CVD, 9.2% ASCVD, 8.1% HF at 10 years; all three 30-year outputs appear separately.
- Editing a value flags stale results and disables transfer until recalculation. Transfer preserves fictional PREVENT inputs and labels other fields as fictional defaults.
- The post-MI example returns secondary lipid and antiplatelet references, withholds first-event PREVENT estimates, and does not display primary-prevention aspirin advice.
- Mobile navigation includes Risk calculators and Secondary prevention. Calculator and post-MI engine pages have no horizontal page overflow at 390px. Desktop engine has no horizontal page overflow at 1440px.

## v0.3 browser checks

- Clinical directory displays all18 areas; mobile directory and VA search show no horizontal overflow at390px.
- The diabetes/CKD fictional case matches SGLT2 and VA finerenone reference criteria with explicit UACR, chronicity, potassium and current-therapy context.
- VA medication search distinguishes semaglutide formulations, national status and indication-specific CFU. Ozempic links its April2026 CFU and September2026 guidance. West Haven context shows official public local resources and unverified local approval steps.
- FIB-4 default example returns2.00. The AF example meets the score threshold. FRAX interpretation accepts entered fictional3% hip/15% major outputs while explicitly stating it does not calculate FRAX.
- No browser console errors were observed during these checks.
- After both preview servers were stopped, a production reload still loaded the VA workspace; finerenone search and the West Haven context worked offline.
- Production build precaches the separate VA data chunk alongside the app. Full-source standalone packaging includes the dataset and disables service-worker registration.

## v0.4 heart-failure and cardiac checks

- Automated tests cover EF 40/41/49/50, missing prior-EF or filling-pressure context, improved EF with prior LVEF ≤40%, and continued GDMT even at NYHA I.
- HFpEF does not inherit the four Class 1/A HFrEF records. Both dated SGLT2 records appear only with the encoded context; renal, potassium, dialysis and current-MRA flags gate selected initiation references.
- Conditional Class 2b options require explicit review context. Ivabradine, digoxin, vericiguat and post-MI beta blocker reassessment remain library references with their unmodeled criteria stated.
- Class and evidence filters combine independently; Class 3 No Benefit and Harm stay distinct. ESC Roman-numeral classes retain original display values; ACC consensus has no fabricated COR/LOE.
- HF finerenone label targets are 40 mg at baseline eGFR ≥60 and 20 mg at baseline eGFR 25–<60, with separate initial doses and label provenance. These are not case-specific prescriptions.
- TypeScript and the production subpath build passed. The standalone package was regenerated.
- Interactive browser verification of v0.4 was unavailable: the connected browser reported an unavailable user interface, including through its documented tab API. Native Codex control was denied. Previous-version browser checks above do not validate the new interface.

## v0.5 statin, grouping and publication-review checks

- ACC 2026 Table 6 supports the three intensity categories and their drug/dose matrix. Tests verify high- and moderate-intensity atorvastatin/rosuvastatin, low-intensity examples, omission of simvastatin 80 as an initiation option, and the maximally tolerated distinction.
- Grouping tests preserve every record once, its original source and grade, filtered/saved subsets, colorectal age matching, and the screening/surveillance distinction. Render checks confirm one colorectal parent retains all five child records and primary links.
- A bounded primary-source audit covers all 18 topics once, with direct links, implementation status and draft safeguards. Reviewed links enter publication discovery; monitoring never promotes their recommendations automatically.
- The 2026 HF/MI definitions and HFSA scientific statement are ungraded. Fixed EF bands are explicitly labeled as 2022 US treatment criteria, not an automated new universal-definition diagnosis. The prior-MI field explicitly requires coronary ASCVD context.
- Current browser verification succeeded using a new agent-owned preview tab. Desktop 1440×1000 and mobile 390×844 displayed the new views without horizontal page overflow; the statin matrix scrolls within its table container on mobile. Old localhost preview ports retained older PWA snapshots; preview also needed the same `/sage/` base path as the build. A fresh origin with matching base path served the current build.

- The colorectal parent expanded to five child references with USPSTF age-specific A/B/C grades and two distinct ACS2026 test-option records. Statin quick help and individual bookmarks worked inside grouped entries.
- The PWA update prompt successfully loaded a rebuilt snapshot. The source-review screen displayed all18 areas and the CKD final-versus-draft distinction. The HF view labeled its2022 treatment bands, and HFSA filtering retained separate source attribution.
- The HFpEF fictional example generated grouped SGLT2 and MRA references with explicit matching reasons. No browser console errors were observed.

## Source-monitor check

The live baseline attempt inspected 17 maintained documents/index pages. Twelve baseline fingerprints were captured. Five AHA/publisher endpoints returned HTTP 403 and remain flagged as access failures. No clinical data was modified. The report is included in `src/data/source-check-report.json` and exposed in the app’s updates screen. New v0.2–v0.5 sources and VA datasets additionally require initial fingerprints; the original report is not a new full live baseline. Scheduled monitoring is included in the repository; its execution status must be checked in GitHub Actions.

## Public deployment

- Source published to [MachaalaniMD/sage](https://github.com/MachaalaniMD/sage), preserving the repository’s existing MIT license.
- GitHub CI test/build run 41378574824 passed. Pages workflow 41378574800, attempt 2, built and deployed successfully after Pages was enabled for Actions.
- Verified [machaalanimd.github.io/sage](https://machaalanimd.github.io/sage/) in the browser: v0.2 PREVENT calculator loaded, produced the expected published example outputs, and reported no browser console errors.
- The updated production PWA was reloaded after both local preview servers were stopped. The calculator still produced its expected output offline.
- Weekly source monitoring is configured in GitHub Actions. The November 2 scheduled run (41536578669, pre-v0.5 commit e09c3a7) reported28 access errors,37 initial observations and12 unchanged fingerprints. It deliberately exited with review-required status, uploaded the report and changed no clinical recommendation data. This observed run is shown in Updates; it is not a live workflow feed.

## Verification limits

- The browser environment permits HTTP(S) pages and refused a `file:` URL, so launching `standalone.html` directly from disk was not browser-tested. Its source uses the same compiled application with the PWA registration disabled and passed packaging/static syntax checks.
- Native app installation, iOS Safari, Android Chrome, and external guideline availability on every device were not tested.
- This is a selected guideline snapshot, not comprehensive coverage or proof that no newer statement exists.
- Clinical accuracy, safety, prescribing, diagnostic performance, and suitability for patient care are not validated by these software tests.
- Public deployment does not confer medical verification or comprehensive guideline coverage.
