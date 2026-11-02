# Sage

A responsive, static Progressive Web App for exploring selected clinical guideline references using **fictional cases only**. Built with React, TypeScript, Vite, Tailwind CSS, shadcn-style Radix UI primitives, and Fuse.js. Live at [machaalanimd.github.io/sage](https://machaalanimd.github.io/sage/); no backend, paid service, or API key is needed.

**Prototype, not clinically validated. Every clinical record and dose table awaits independent medical verification.** Source-specific access dates are retained; the expanded snapshot was checked November 2, 2026. This is a selected snapshot and does not claim comprehensive or perpetually current coverage.

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

- Eighteen clinical areas covering the requested primary-care subjects plus selected primary/secondary prevention. Each area has explicit coverage limits.
- 124 draft recommendations, 66 source records, searchable society-specific grades, eight selected HFrEF dose references and four separate HFpEF/HFmrEF label-dose entries.
- National VA primary-care workspace and a West Haven / VA Connecticut view. Search 5,581 source formulary entries, distinguish formulations/indications/status, and open active CFU/guidance documents with revision dates.
- Search by recommendation, condition, medication, or society; topic, society, recommendation-class and independent evidence-level filters. A cardiac collection includes Class 1, 2a, 2b, Class 3 No Benefit and Class 3 Harm records, plus consensus without a fabricated COR.
- Fictional-case matching with age, comorbidities, labs, average BP, vaccine history, and VA/DoD context.
- PREVENT simplified base equations: 10-year total CVD, ASCVD and HF; 30-year estimates at ages 30–59. Results can populate the fictional decision engine.
- FIB-4 arithmetic with the 2026 CKM age-specific pathway, CHA₂DS₂-VASc with AF-specific anticoagulation thresholds, and an official external FRAX link plus interpretation of entered fictional U.S. outputs. Sage does not calculate FRAX.
- Post-MI lipid goals, maximally tolerated statin/add-on context, first-year ACS versus chronic-coronary antiplatelet references, BP thresholds, rehabilitation and VA/DoD lipid context.
- Explicit matching reasons, missing coverage, pending-review labels, and society-specific grading.
- Recommendation detail records with source location, original publication version, evidence metadata, and direct primary links.
- HFrEF, HFmrEF, HFpEF and HFimpEF library filters. Separate 2022 US formal grades, 2026 ACC HFpEF consensus and selected 2026 ESC grades. Separate HFrEF Table 14 and HFpEF/HFmrEF product-label dose tables, including the HF-specific finerenone targets.
- Three recorded guideline version comparisons, each awaiting medical review.
- Session-only bookmarks. Source catalog and app installation guidance.
- Offline production app snapshot, with explicit dates and a manual reload prompt when an updated build is ready.
- Automated clinical-rule boundary, data-integrity, search, and monitor tests.

## Privacy

Use fictional examples only. There are no patient identifiers, accounts, uploads, analytics, trackers, cookies, clinical network requests, or clinical storage. Case values, queries and saved-reference choices live in React memory and clear on page reload. They are not placed in URLs, localStorage, sessionStorage, IndexedDB, or a server. Navigation uses only nonidentifying section hashes.

The service worker caches static application assets and the bundled source snapshot. It has no runtime data cache and does not cache case values. There are no external fonts or CDN scripts. Guideline links open in a separate tab with `noreferrer`. Hosting providers may retain ordinary access logs; no case values are part of those requests.

## Clinical scope and known limits

The engine is deterministic selected-pathway matching, **not an exhaustive decision engine, diagnosis, treatment plan, prescribing tool, or safety assessment**. A missing match does not mean no care is indicated. ACC/AHA BP pathways use total CVD risk; lipid pathways use ASCVD risk. First-event estimates are withheld with prior MI, known ASCVD or HF. No recurrent-event score is provided.

The fictional cases illustrate the age-47 diabetes/statin question, age-58 routine vaccines, HFrEF pillars, selected prevention, and secondary prevention after prior MI. A fictional kidney case demonstrates diabetes with albuminuric CKD. A seventh case demonstrates HFpEF with confirmed filling-pressure evidence and EF history. The engine adds selected diabetes, kidney, screening, obesity, laboratory-monitoring and medication-review matches when their context is explicitly entered. The reference library also covers risk-based vaccine schedules, major USPSTF screening, infections, cancer surveillance, lifestyle and deprescribing. No personalized catch-up vaccination date, cancer surveillance calendar, perioperative anticoagulant stop date, or medication taper is generated. Automatic COVID scheduling is deferred for source-date review.

HFrEF records and doses cite the 2022 AHA/ACC/HFSA guideline and official slide set. HFpEF has a separate pathway covering SGLT2 inhibitors, BP, AF, selected MRA/ARB/ARNI options and routine nitrate/PDE-5 no-benefit guidance. HFmrEF and HFimpEF are distinct. EF >40% requires explicit prior-EF history and objective filling-pressure evidence for HFpEF/HFmrEF matching; prior EF ≤40% triggers continued-GDMT guidance instead. The 2026 ACC HFpEF consensus is ungraded and shown alongside the original 2022 formal grades; selected 2026 ESC recommendations retain their own grades. Conditional add-ons, ivabradine, digoxin, vericiguat and post-MI beta blocker reassessment are reference content, not automatic prescriptions. Finerenone HF and diabetic-CKD targets are not conflated. VA authorization remains a separate indication-specific review. The MRA match checks only the encoded NYHA, renal and potassium conditions. Other pillars also need clinical assessment. Medication history, current therapy, contraindications, pregnancy, frailty, interactions, volume status and many other safety factors are not fully assessed. The VA lipid pathway withholds matches for the encoded HFrEF ≤35%, dialysis and very low eGFR exclusions; other scope exclusions still need review.

CDC recommendations, USPSTF grades, VA/DoD GRADE strength, and ACC/AHA classes and levels retain their original systems. Missing evidence levels are explicitly null, never inferred. The broad hypertension threshold overview does not have a single fabricated class or evidence level. Indexed publisher text was used where direct access was restricted; that access limitation is recorded.

## PREVENT implementation and provenance

This is an independent implementation of the **publicly published simplified base equations** from Khan et al., *Circulation* 2024, [primary paper and supplementary Tables S12A/S12F](https://pmc.ncbi.nlm.nih.gov/articles/PMC10910659/). It does not use AHA's gated software and is not official AHA software or endorsed by AHA. Coefficients retain table, sheet and cell-range provenance and the downloaded supplement checksum. The full source workbook is not redistributed.

All 12 sex/outcome/horizon outputs match the original spreadsheet's stored example results within 1e-12, and the paper's worked examples match after published rounding. This checks implementation fidelity, not clinical validity. Eligibility follows the [current AHA calculator guidance](https://professional.heart.org/en/guidelines-and-statements/prevent-calculator): 10-year ages 30–79; 30-year ages 30–59. Input bounds are checked without clamping. UACR, HbA1c and SDI extensions are not implemented. eGFR is a supplied lab value, not calculated here. Risks overlap and must not be added.

Very-high-risk ASCVD status requires explicit confirmation against Figure 10; one prior MI does not automatically determine it. Antithrombotic references require explicit bleeding, anticoagulation and contraindication context. These remain selected references, without full regimen selection, PCI review or medication safety assessment. VA/DoD risk-only automatic statin matching is deferred pending confirmation of the intended PREVENT endpoint; diabetes and LDL criteria are encoded. FRAX mathematics and KFRE are not implemented. The FRAX pathway explicitly interprets manually entered external outputs; KFRE-dependent matching remains deferred. BMI outside the PREVENT model range can still match independent obesity references.

## Structured source and version data

- `src/data/sources.json` and `*-sources.json`: source IDs, society, publication year, version, URL, access check and access method. All catalogs are included in source monitoring.
- `src/data/recommendations.json`, `additional-recommendations.json`, and `*-expansion.json`: record revision, population, source locator, evidence system, original grade when extracted, cautions, and `pending-medical-review` status.
- `src/data/prevent-coefficients.json`: public model coefficients, source cell ranges, checksum and original numerical fixtures.
- `src/data/doses.json`: selected Table 14 initial/target doses, with row-level source and locator.
- `src/data/versions.json`: selected before/after summaries linked to the source's update table; not complete historical guideline reproductions.
- `src/data/va-formulary.json`: normalized public VA source rows, active document mappings, source refresh date, checked date and original-source SHA-256 hashes.
- `src/data/west-haven.json`: verified public local resources and explicit gaps in local approval-process verification.
- `src/data/publication-alerts.json`: draft/publication/access findings kept separate from final clinical recommendations.
- `src/data/watch-pages.json`: publication-discovery indexes alongside individual source documents.
- `src/data/source-fingerprints.json`, when generated: source-check fingerprints only. These are not clinical approvals.

Before any clinical release, a qualified reviewer must verify every summary, recommendation number, population boundary, grade, dose, contraindication, and superseding source. Capture reviewer identity and verification date, retain the prior data revision in Git, update coverage tests, and complete a deliberate release review. Nothing in this prototype asserts that this review has happened.

## VA medication access and West Haven

The bundled national formulary comes from the public VA Formulary Advisor `VANF.json`, `DOC.json` and `VERSIONS.json` feeds. The original refresh is October 29, 2026; access was checked November 2. All 5,581 source rows are retained, including repeated VUIDs where class or restriction notes differ. The snapshot includes 752 active document mappings and excludes 148 archived documents from active guidance. Data import does not confer medical approval. Brand synonyms do not guarantee brand coverage; national status does not determine local stock, clinical eligibility or individual authorization.

Formulary, facility prior authorization, non-formulary and non-approved-product statuses are distinct. The access workflow links indication-specific CFU and VHA Directive 1108.08. Sage does not submit requests, adjudicate exceptions or store documentation. The West Haven view links official VA Connecticut pharmacy/facility resources, with the source page’s historical date. Current local PADR order names, adjudication checklists and turnaround times were **not publicly verified**; confirm them through VA Connecticut pharmacy and approved VA systems.

To prepare a new snapshot proposal:

```sh
npm run va:proposal
```

This downloads only fixed public VA feeds and writes `.source-monitor/va-formulary-proposal.json`. It never replaces `src/data/va-formulary.json`. Review source refresh, status definitions, restrictions, active/archived links and changes before deliberately promoting a proposal in a reviewed commit. The weekly source monitor watches all three feeds and the national publication index, without editing active data. No medication lookup is sent to VA by Sage.

## Source change detection

```sh
npm run sources:baseline
npm run sources:check
```

The baseline command establishes **missing** fingerprints only; it never advances an existing fingerprint. The checker requests only maintained public primary-source URLs, follows redirects within an allowlist, hashes normalized main-page text or PDF bytes, and creates `source-check-results.json`. It cannot read or send case values.

Reports distinguish `baseline-needed`, `unchanged`, `changed-review-required`, `baseline-mismatch`, and `access-error`. Access failures and anti-bot challenges are never treated as unchanged. The checker exits 2 on access errors and 1 on changes requiring review, while retaining the full report. A changed hash can reflect page maintenance rather than clinical content. Discovery index monitoring flags possible new publications for a person to inspect; it does not guarantee detection of every guideline release.

The initial v0.1 baseline attempt recorded 12 of 17 monitored pages/documents. The v0.2–v0.4 additions require initial fingerprints; the displayed report remains the original dated check, not a live complete report. Five AHA/publisher endpoints returned HTTP 403 and remain flagged; those documents cannot currently be monitored automatically from this environment. The initial report is retained in `src/data/source-check-report.json` and summarized in the app. Readable indexed text and official PDFs accessed through the research tools supported the source catalog, but automated access and medical verification remain separate questions.

The included weekly GitHub workflow checks source documents and discovery pages, restores the original baseline, writes a workflow summary, and uploads the report. Baseline cache eviction can cause reinitialization; preserve a medically reviewed baseline in the tracked JSON file to avoid this. Changed fingerprints never replace active recommendation data. After reviewing a change, update the corresponding fingerprint deliberately in a reviewed commit. No issues, emails, or messages are automatically sent. GitHub's normal workflow-failure notification preferences may apply to access failures.

## Publish on GitHub Pages

Repository: [MachaalaniMD/sage](https://github.com/MachaalaniMD/sage). Pages URL: [machaalanimd.github.io/sage](https://machaalanimd.github.io/sage/). The workflow run and live URL determine actual deployment status.

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

Sage is independent and not endorsed by CDC, USPSTF, ACC, AHA, HFSA, ESC, VA, or DoD. Primary-source documents remain with their respective publishers.
