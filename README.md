# Sage

A responsive, static Progressive Web App for exploring selected clinical guideline references using **fictional cases only**. Built with React, TypeScript, Vite, Tailwind CSS, shadcn-style Radix UI primitives, and Fuse.js. Configured for [machaalanimd.github.io/sage](https://machaalanimd.github.io/sage/); no backend, paid service, or API key is needed.

**Prototype, not clinically validated. Every clinical record and dose table awaits independent medical verification.** Source access was checked on November 1, 2026. This is a selected snapshot and does not claim comprehensive or perpetually current coverage.

## Run locally

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Then open the local URL printed by Vite. For the production PWA:

```sh
npm test
npm run build
npm run preview
```

Service workers and installation are enabled in the production build, not the development server. Use HTTPS or localhost. Install through your browser when available; on iOS, use Safari → Share → Add to Home Screen.

For a self-contained local demonstration, open the included `standalone.html` in a browser. It embeds the app, styles, and reference data, and disables service-worker registration. It does not require a server or an installation. Regenerate it with `npm run standalone`. The hosted production build remains the installable PWA.

## What works

- Overview with six clinical areas: adult vaccinations, dyslipidemia, hypertension, heart failure GDMT, selected primary prevention, and secondary prevention after MI/ASCVD.
- Search by recommendation, condition, medication, or society; topic and society filters.
- Fictional-case matching with age, comorbidities, labs, average BP, vaccine history, and VA/DoD context.
- PREVENT simplified base equations: 10-year total CVD, ASCVD and HF; 30-year estimates at ages 30–59. Results can populate the fictional decision engine.
- Post-MI lipid goals, maximally tolerated statin/add-on context, first-year ACS versus chronic-coronary antiplatelet references, BP thresholds, rehabilitation and VA/DoD lipid context.
- Explicit matching reasons, missing coverage, pending-review labels, and society-specific grading.
- Recommendation detail records with source location, original publication version, evidence metadata, and direct primary links.
- Selected HFrEF starting and target doses, with separate Table 14 source provenance.
- Three recorded guideline version comparisons, each awaiting medical review.
- Session-only bookmarks. Source catalog and app installation guidance.
- Offline production app snapshot, with explicit dates and a manual reload prompt when an updated build is ready.
- Automated clinical-rule boundary, data-integrity, search, and monitor tests.

## Privacy

Use fictional examples only. There are no patient identifiers, accounts, uploads, analytics, trackers, cookies, server calls, or clinical storage. Case values, queries and saved-reference choices live in React memory and clear on page reload. They are not placed in URLs, localStorage, sessionStorage, IndexedDB, or a server. Navigation uses only nonidentifying section hashes.

The service worker caches static application assets and the bundled source snapshot. It has no runtime data cache and does not cache case values. There are no external fonts or CDN scripts. Guideline links open in a separate tab with `noreferrer`. Hosting providers may retain ordinary access logs; no case values are part of those requests.

## Clinical scope and known limits

The engine is deterministic selected-pathway matching, **not an exhaustive decision engine, diagnosis, treatment plan, prescribing tool, or safety assessment**. A missing match does not mean no care is indicated. ACC/AHA BP pathways use total CVD risk; lipid pathways use ASCVD risk. First-event estimates are withheld with prior MI, known ASCVD or HF. No recurrent-event score is provided.

The fictional cases illustrate the age-47 diabetes/statin question, age-58 routine vaccines, HFrEF pillars, selected prevention, and secondary prevention after prior MI. Rules intentionally defer incomplete pneumococcal/RZV histories, immunocompromised RZV schedules, younger-woman fracture risk assessment, and unencoded pathways. COVID-19, RSV, Tdap, and other vaccination pathways are not implemented. No exact catch-up dose date is calculated.

HFrEF records and doses cite the 2022 AHA/ACC/HFSA guideline and official slide set. The MRA match checks only the encoded NYHA, renal and potassium conditions. Other pillars also need clinical assessment. Medication history, current therapy, contraindications, pregnancy, frailty, interactions, volume status and many other safety factors are not fully assessed. The VA lipid pathway withholds matches for the encoded HFrEF ≤35%, dialysis and very low eGFR exclusions; other scope exclusions still need review.

CDC recommendations, USPSTF grades, VA/DoD GRADE strength, and ACC/AHA classes and levels retain their original systems. Missing evidence levels are explicitly null, never inferred. The broad hypertension threshold overview does not have a single fabricated class or evidence level. Indexed publisher text was used where direct access was restricted; that access limitation is recorded.

## PREVENT implementation and provenance

This is an independent implementation of the **publicly published simplified base equations** from Khan et al., *Circulation* 2024, [primary paper and supplementary Tables S12A/S12F](https://pmc.ncbi.nlm.nih.gov/articles/PMC10910659/). It does not use AHA's gated software and is not official AHA software or endorsed by AHA. Coefficients retain table, sheet and cell-range provenance and the downloaded supplement checksum. The full source workbook is not redistributed.

All 12 sex/outcome/horizon outputs match the original spreadsheet's stored example results within 1e-12, and the paper's worked examples match after published rounding. This checks implementation fidelity, not clinical validity. Eligibility follows the [current AHA calculator guidance](https://professional.heart.org/en/guidelines-and-statements/prevent-calculator): 10-year ages 30–79; 30-year ages 30–59. Input bounds are checked without clamping. UACR, HbA1c and SDI extensions are not implemented. eGFR is a supplied lab value, not calculated here. Risks overlap and must not be added.

Very-high-risk ASCVD status requires explicit confirmation against Figure 10; one prior MI does not automatically determine it. Antithrombotic references require explicit bleeding, anticoagulation and contraindication context. These remain selected references, without full regimen selection, PCI review or medication safety assessment. VA/DoD risk-only automatic statin matching is deferred pending confirmation of the intended PREVENT endpoint; diabetes and LDL criteria are encoded. FRAX and other uncovered calculators are not implemented; their dependent pathways are explicitly deferred.

## Structured source and version data

- `src/data/sources.json`: source IDs, society, publication year, version, URL, access check and access method.
- `src/data/recommendations.json` and `additional-recommendations.json`: record revision, population, source locator, evidence system, original grade when extracted, cautions, and `pending-medical-review` status.
- `src/data/prevent-coefficients.json`: public model coefficients, source cell ranges, checksum and original numerical fixtures.
- `src/data/doses.json`: selected Table 14 initial/target doses, with row-level source and locator.
- `src/data/versions.json`: selected before/after summaries linked to the source's update table; not complete historical guideline reproductions.
- `src/data/watch-pages.json`: publication-discovery indexes alongside individual source documents.
- `src/data/source-fingerprints.json`, when generated: source-check fingerprints only. These are not clinical approvals.

Before any clinical release, a qualified reviewer must verify every summary, recommendation number, population boundary, grade, dose, contraindication, and superseding source. Capture reviewer identity and verification date, retain the prior data revision in Git, update coverage tests, and complete a deliberate release review. Nothing in this prototype asserts that this review has happened.

## Source change detection

```sh
npm run sources:baseline
npm run sources:check
```

The baseline command establishes **missing** fingerprints only; it never advances an existing fingerprint. The checker requests only maintained public primary-source URLs, follows redirects within an allowlist, hashes normalized main-page text or PDF bytes, and creates `source-check-results.json`. It cannot read or send case values.

Reports distinguish `baseline-needed`, `unchanged`, `changed-review-required`, `baseline-mismatch`, and `access-error`. Access failures and anti-bot challenges are never treated as unchanged. The checker exits 2 on access errors and 1 on changes requiring review, while retaining the full report. A changed hash can reflect page maintenance rather than clinical content. Discovery index monitoring flags possible new publications for a person to inspect; it does not guarantee detection of every guideline release.

The initial v0.1 baseline attempt recorded 12 of 17 monitored pages/documents. Three sources were added in v0.2 and require initial fingerprints. Five AHA/publisher endpoints returned HTTP 403 and remain flagged; those documents cannot currently be monitored automatically from this environment. The initial report is retained in `src/data/source-check-report.json` and summarized in the app. Readable indexed text and official PDFs accessed through the research tools supported the source catalog, but automated access and medical verification remain separate questions.

The included weekly GitHub workflow checks source documents and discovery pages, restores the original baseline, writes a workflow summary, and uploads the report. Baseline cache eviction can cause reinitialization; preserve a medically reviewed baseline in the tracked JSON file to avoid this. Changed fingerprints never replace active recommendation data. After reviewing a change, update the corresponding fingerprint deliberately in a reviewed commit. No issues, emails, or messages are automatically sent. GitHub's normal workflow-failure notification preferences may apply to access failures.

## Publish on GitHub Pages

Repository: [MachaalaniMD/sage](https://github.com/MachaalaniMD/sage). Intended Pages URL: [machaalanimd.github.io/sage](https://machaalanimd.github.io/sage/). The workflow run and live URL determine actual deployment status.

1. Keep this directory's contents on the repository’s `main` branch, with `package.json` at repository root.
2. In repository Settings → Pages → Build and deployment, select **GitHub Actions**.
3. The included `pages.yml` runs tests, builds the app with the correct repository base path from `configure-pages`, and deploys the static `dist/` artifact.
4. Check the workflow's actual returned Pages URL. For a project repository this is usually `https://USERNAME.github.io/sage/`. A root user site uses a repository named `USERNAME.github.io`.

`sage.github.io` requires control of the GitHub user or organization named `sage`; it is not an arbitrary free subdomain available to another account. See [GitHub Pages quickstart](https://docs.github.com/en/pages/quickstart) and [publishing source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

For a manual subdirectory build:

```sh
BASE_PATH=/sage/ npm run build
```

Hash navigation avoids GitHub Pages deep-link 404s. PWA scope and static asset URLs follow the build base path. Before public deployment, keep the prototype and pending-verification notices visible.

## Verification

`npm test` runs boundary and source-monitor fixture tests; it does not medically validate the content. `npm run build` performs TypeScript checking and creates the PWA. Browser checks should cover search, filters, details, bookmarks, engine results and invalid inputs, version comparisons, mobile navigation, root and repository-subpath routing, and offline production reloads.

The PNG app icons can be regenerated from the code-native leaf mark with `node scripts/generate-icons.mjs`.

Sage is independent and not endorsed by CDC, USPSTF, ACC, AHA, HFSA, VA, or DoD. Primary-source documents remain with their respective publishers.
