# Prototype validation — November 1, 2026

This records software checks, not clinical approval. Every clinical recommendation, comparison, and dose remains pending independent medical verification.

## Automated checks

- 59 Vitest tests passed: 49 clinical-rule, search and provenance checks; 10 source-monitor fixture checks.
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

## Source-monitor check

The live baseline attempt inspected 17 maintained documents/index pages. Twelve baseline fingerprints were captured. Five AHA/publisher endpoints returned HTTP 403 and remain flagged as access failures. No clinical data was modified. The report is included in `src/data/source-check-report.json` and exposed in the app’s updates screen. Scheduled GitHub monitoring is prepared but is not active until this repository is hosted on GitHub.

## Verification limits

- The browser environment permits HTTP(S) pages and refused a `file:` URL, so launching `standalone.html` directly from disk was not browser-tested. Its source uses the same compiled application with the PWA registration disabled and passed packaging/static syntax checks.
- Native app installation, iOS Safari, Android Chrome, and external guideline availability on every device were not tested.
- This is a selected guideline snapshot, not comprehensive coverage or proof that no newer statement exists.
- Clinical accuracy, safety, prescribing, diagnostic performance, and suitability for patient care are not validated by these software tests.
- No GitHub repository, public deployment, domain reservation, or cloud schedule was created.
