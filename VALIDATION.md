# Prototype validation — November 1, 2026

This records software checks, not clinical approval. Every clinical recommendation, comparison, and dose remains pending independent medical verification.

## Automated checks

- 108 Vitest tests passed: 64 clinical-rule, search and provenance checks; 34 PREVENT checks; 10 source-monitor fixture checks.
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

## Source-monitor check

The live baseline attempt inspected 17 maintained documents/index pages. Twelve baseline fingerprints were captured. Five AHA/publisher endpoints returned HTTP 403 and remain flagged as access failures. No clinical data was modified. The report is included in `src/data/source-check-report.json` and exposed in the app’s updates screen. Three v0.2 sources additionally require initial fingerprints. Scheduled monitoring is included in the repository; its execution status must be checked in GitHub Actions.

## Public deployment

- Source published to [MachaalaniMD/sage](https://github.com/MachaalaniMD/sage), preserving the repository’s existing MIT license.
- GitHub CI test/build run 41378574824 passed. Pages workflow 41378574800, attempt 2, built and deployed successfully after Pages was enabled for Actions.
- Verified [machaalanimd.github.io/sage](https://machaalanimd.github.io/sage/) in the browser: v0.2 PREVENT calculator loaded, produced the expected published example outputs, and reported no browser console errors.
- The updated production PWA was reloaded after both local preview servers were stopped. The calculator still produced its expected output offline.
- Weekly source monitoring is configured in GitHub Actions. The weekly job has not yet executed; the initial source access limitations above remain applicable.

## Verification limits

- The browser environment permits HTTP(S) pages and refused a `file:` URL, so launching `standalone.html` directly from disk was not browser-tested. Its source uses the same compiled application with the PWA registration disabled and passed packaging/static syntax checks.
- Native app installation, iOS Safari, Android Chrome, and external guideline availability on every device were not tested.
- This is a selected guideline snapshot, not comprehensive coverage or proof that no newer statement exists.
- Clinical accuracy, safety, prescribing, diagnostic performance, and suitability for patient care are not validated by these software tests.
- Public deployment does not confer medical verification or comprehensive guideline coverage.
