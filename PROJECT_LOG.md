
## 2026-11-14 10:40 | Prompt archive and protected snapshot
- What was done: Archived the complete supplied prompt verbatim before feature work.
- Files created or changed: prompts/user/01_2026-11-14_whatif-simulator-and-logging.md, PROMPTS_USED.md, PROJECT_LOG.md.
- Tests run and counts (Python and JS): Not yet run.
- Decisions and trade-offs: No secrets were present in this supplied prompt.
- Problems found / not verified: Existing state and baseline pending.
- Next step: Baseline tests, prompt-file discovery and evaluator inspection.

## 2026-11-14 10:42 | Baseline and design
- What was done: Inspected deterministic evaluator, personal scoping, and frontend analysis. Discovered prior documentation references for prompt index. Backed up all existing files planned for editing.
- Files created or changed: backups/whatif/, PROMPTS_USED.md, PROJECT_LOG.md.
- Tests run and counts (Python and JS): Baseline running; final counts will follow.
- Decisions and trade-offs: New endpoint will receive explicit confirmation flags and selected analysis rule IDs, resolve only live owned rules, reuse evaluate(), and keep scenarios entirely transient. Confirmation remains a user assertion as in existing analysis.
- Problems found / not verified: No existing server-side analysis session is stored. Formula is directly applicable to lower-bound percentage rules; other operators need explicit arithmetic handling.
- Next step: Implement scoped arithmetic endpoint and scenario panel.

## 2026-11-14 10:43 | Simulator implementation
- What was done: Added explicit scoped scenario endpoint, Decimal gap/count arithmetic and transient scenario panel with reset, percentage sliders, count inputs and live results. Reuses existing evaluator and current rule validation.
- Files created or changed: src/whatif.py, src/server.py, web/personal.js, web/index.html.
- Tests run and counts (Python and JS): JavaScript syntax check passed; baseline final counts pending log entry.
- Decisions and trade-offs: Client sends selected live rule IDs plus confirmation flags. No backend analysis session, storage writes, model calls or new in-app prompts. Count arithmetic models generic items only.
- Problems found / not verified: Arithmetic boundaries, API isolation, non-persistence and browser behavior still require verification.
- Next step: Add regression and random arithmetic tests, then disposable browser checks.

## 2026-11-14 10:46 | Arithmetic and endpoint regressions
- What was done: Verified Decimal count paths against 300 independent integer-loop cases, operator boundaries, zero/invalid counts, unit mismatch, missing confirmation, conflicts, owner isolation, no persistence and blocked provider layer.
- Files created or changed: tests/test_whatif.py, src/whatif.py, web/personal.js.
- Tests run and counts (Python and JS): Baseline 287 Python passed with six warnings; existing JS DOM suites passed. Focused simulator tests 17 passed with six warnings. JS syntax passed.
- Decisions and trade-offs: Any conflicting selected subject suppresses the combined verdict and all paths. Scenario facts are memory-only and new requests revalidate current rules.
- Problems found / not verified: Browser display, reset, safe rendering and responsive screenshots pending.
- Next step: Disposable provider-blocked browser workflow and final full suites.

## 2026-11-14 10:49 | Browser QA and documentation
- What was done: Disposable fixture workflow checked confirmed analysis entry, prefill, scenario changes, real-fact preservation, reset, counts hand calculation, aria-live output and HTML escaping with provider access blocked. Captured four desktop/mobile theme screenshots. Initial visual review found excessive decimal digits; shortened displays with an explicit approximation marker and repeated the browser checks successfully. Added a zero-provider disposable demo runner and short design/interview notes.
- Files created or changed: scripts/demo_whatif.py, docs/screenshots/whatif/*, tests/whatif_frontend.test.cjs, tests/test_whatif.py, web/personal.js, web/index.html, DECISIONS.md, INTERVIEW_NOTES.md.
- Tests run and counts (Python and JS): Full suite 306 passed with six dependency warnings before the display refinement. Existing JS suites plus new what-if DOM checks passed. Browser reported zero errors and zero provider calls.
- Decisions and trade-offs: Demo setup substitutes deterministic fixture analysis to avoid the existing analysis explanation model call; scenario endpoint is the actual new endpoint. No inference quality claim.
- Problems found / not verified: Final repeat after display refinement, screenshot inspection of all four images and localhost restart pending.
- Next step: Final tests, hashes, all screenshot inspection, restart, final archive outcome.

## 2026-11-14 10:51 | Confirmation invalidation and responsive refinement
- What was done: Added explicit prerequisite empty state, invalidated scenarios when real facts or confirmations change, guarded late analysis completion, and fixed count-form grid alignment. All text remains escaped; numeric approximation is display-only.
- Files created or changed: web/personal.js, web/index.html, temporary browser checks.
- Tests run and counts (Python and JS): Full-suite rerun and all four JS harnesses underway. Earlier 306 Python tests passed. Browser screenshot workflow passed before final confirmation-withdrawal assertion.
- Decisions and trade-offs: Changing real inputs requires fresh confirmed analysis before another scenario. Existing eligibility evaluator behavior is preserved.
- Problems found / not verified: Final confirmation-withdrawal result and localhost restart pending.
- Next step: Inspect final four screenshots, finalize tests/hashes, restart main app and disposable demo, append final report.

## 2026-11-14 10:53 | Final verification and screenshots
- What was done: Inspected all four final screenshot panels, verified confirmation withdrawal removes the scenario, and rechecked safe rendering, banner/reset, counts and no horizontal overflow. Added 200 fractional-threshold cases against independent integer brute force, supplementing 300 mixed-operator random cases.
- Files created or changed: tests/test_whatif.py, final screenshots, PROJECT_LOG.md.
- Tests run and counts (Python and JS): Final suite result recorded below; all existing JS harnesses plus the new what-if harness passed. Disposable browser audit reports zero provider calls and zero browser errors.
- Decisions and trade-offs: Original confirmed values stay separate from scenario state; display truncation is explicitly approximate.
- Problems found / not verified: Synthetic setup uses fixture analysis; live extraction quality and institutional counting practices remain unverified.
- Next step: Restart main localhost app and disposable demo, confirm both load, append final summary and archive outcome.

## 2026-11-14 10:54 | Final report — Path to Eligibility completed
- What was done: Built transient scenario controls, reset and scenario banner, debounced workspace-scoped endpoint, same-evaluator verdicts, direct gaps, generic count arithmetic, quoted caveats, conflict blocking, confirmation invalidation, safe rendering and light/dark responsive layout. Archived the original user prompt byte-for-byte and indexed repository instruction/document references.
- Files created or changed: src/whatif.py (new); src/server.py (new router registration only); web/personal.js; web/index.html; tests/test_whatif.py (new); tests/whatif_frontend.test.cjs (new); scripts/demo_whatif.py (new); DECISIONS.md; INTERVIEW_NOTES.md; PROJECT_LOG.md; PROMPTS_USED.md; prompts/user/01_2026-11-14_whatif-simulator-and-logging.md; docs/screenshots/whatif/{1440,390}-{light,dark}.png; backups/whatif/ original files and verification logs. Existing application prompts, retrieval and thresholds were not edited.
- Tests run and counts (Python and JS): Before 287 Python tests; after 307 Python tests, six dependency warnings. Existing dashboard/personal/sidebar JS harnesses and new what-if DOM harness all pass. Arithmetic checks include 300 mixed-operator random cases and 200 fractional lower-bound cases against independent integer brute force. Browser checked prefill, live changes, unchanged real facts, reset, banner, counts hand calculation, aria-live, confirmation withdrawal and HTML escaping. Four final screenshots visually inspected at 1440px and 390px in light/dark, with no horizontal overflow or browser errors. Provider calls during feature verification: zero. All 219 protected hashes match, including institutional registry/index state.
- Decisions and trade-offs: Personal capability required in both URL and header. Request sends facts (string numeric values), rule_ids, optional subject-keyed counts and explicit confirmed/applicability_confirmed booleans. Confirmation is a user assertion consistent with current analysis, not a server-side attestation that the analysis endpoint was previously called. Facts and count scenarios are never saved. Count mode derives the scenario value only for an existing fact. Conflicts remove all paths and the combined verdict. Percent display is shortened with ≈ while server comparisons use Decimal. Existing-file originals are in backups/whatif/.
- Problems found / not verified: No institutional counting conventions, cut-off dates, condonation, rounding practices, exception entitlement, policy authenticity or official eligibility is inferred. The zero-provider demo substitutes fixture analysis to avoid the existing optional AI explanation; it exercises the actual simulator endpoint and validated fixture rules. Live extraction quality was not evaluated. Near-zero percentage differences below the 80-digit count-calculation precision are outside supported input precision; normal facts support at most 24 decimal places.
- Next step: Demo only, then stop feature work. Main app returned HTTP 200 at localhost:8000 and OpenAPI lists the new endpoint. Disposable demo entry returned HTTP 200 at localhost:8028/fixture/start and its provider audit is zero.

Under-one-minute synthetic demo: open http://localhost:8028/fixture/start (already running). Open Rule Book to load the prevalidated completion rule, then Ask & Analyse. Enter a short question, click Add a fact, set completion to 70 with unit %, check both confirmations, and click Analyse confirmed facts. In What if I change this?, enter 75 to see satisfied/eligible; Reset restores 70. Enable Compute from counts, enter done=60, total=90, remaining=50. The panel shows 30 consecutive completed items and at most five missed remaining items. This is explicitly SYNTHETIC TEST FIXTURE arithmetic. If the disposable demo is stopped, run python scripts/demo_whatif.py from the project root. The demo uses temporary storage and blocks provider access. Stop it with Ctrl+C when finished.

## 2026-11-14 11:47 | Gemini failover — final verification complete
- What was done: Fixed E2E test question (was ambiguous; replaced with direct fixture query matching "What attendance percentage is required in this fictional test document?"). Removed erroneous `pace_provider` call that added spurious sleeps, breaking 7 LLM unit tests. Updated `test_gemini_failover.py` daily-quota assertion to `len(sleep_calls) == 0` (no backoff on immediate quota failover). Ran full pipeline health check (11/11 PASS, Groq hit quota mid-run, Gemini picked up transparently).
- Files created or changed: scripts/verify_gemini_failover_e2e.py, src/llm.py, tests/test_gemini_failover.py.
- Tests run and counts (Python and JS): Python pytest 313 passed 0 failed. JS DOM: 19 dashboard + personal + what-if passed.
- Live Gemini calls this session: 1 ping (1257ms) + 1 E2E failover (5364ms, answered "at least 75 percent") = 2 total (budget was 3).
- Hash check: 38-file audit baseline — 0 mismatches. 219-file improve_hyde baseline — 3 expected runtime-state changes (personal_workspaces.json, hyde_cache.json, chroma.sqlite3); 0 source/policy/PDF/manifest changes.
- Secret scan: GEMINI_API_KEY string found in 0 files outside .env. PASS.
- Problems found / not verified: None. Provider auto-failover was live-verified on a disposable instance. Institution data untouched.
- Next step: Feature-frozen. Ready for demo.

## 2026-11-14 — Focused personal document inspection UX

Added Close Preview/Escape/focus restoration and a dedicated View Chunks screen using a small personal-only read endpoint. Verified all 77 stored personal NIT Goa chunks against existing detail responses and browser rendering. Full suite: 315 passed; four JS suites and desktop/mobile light/dark browser checks passed. No production mutation requests. Data-file metadata unchanged except the shared Chroma SQLite modification timestamp; do not claim whole-database byte identity. Full file list, exact commands and verification limits: docs/DOCUMENT_INSPECTION_UI.md.

## 2026-11-14 — Personal chunk overlap and section boundary correction

Changed only src/chunking.py application code: source-offset-aware merges preserve deliberate repetition, never cross page/section boundaries, and join split numbered headings with titles. Added 14 regression cases and verbatim page-10 test fixture with provenance. Tests: 28 focused and 329 full-suite passes. Offline NIT Goa candidate: 77 → 114 chunks; Attendance 2568 → 2400 characters, complete B11.1–B11.5 verified against source and B12.1 correctly separated. User explicitly requested live index remain untouched when shared-database conflict was explained: no re-index, embeddings or provider calls. All 239 production files byte-identical by SHA-256. Full before/after text and test commands: docs/NIT_GOA_CHUNKING_FIX.md.

## 2026-11-14 — Answer context and validation repair

Regression-first: 7 of 11 initial cases reproduced grounding failures. Implemented bounded complete-provision selection, shared exact-excerpt validation for fresh/cached answers, and opt-in redacted local diagnostics. Added 24 regression cases. Full Python suite: 353 passed, 6 dependency warnings. No live provider calls, re-indexing, embeddings or live database write operations. Modified application files: src/answer.py, src/evidence.py, src/pipeline.py, src/trace.py, src/prompts.py; new src/answer_diagnostics.py. Added tests/test_answer_grounding_regressions.py and docs/ANSWER_GROUNDING_FIX.md; appended PROMPTS.md, DECISIONS.md, INTERVIEW_NOTES.md and this log. Full commands, behavior and limitations are in the report.

## 2026-11-16 — Remove scripted answers and comparison; assess actual readiness

Removed eight-question keyword-based prepared answer bypass, fixed comparison endpoint/auth exception, comparison dataset, artificial progress and delay. Restored real workspace-scoped answer and rule-version comparison routes. Corrected source-card lookup by citation ID and restored personal trust notice. Added 29 endpoint regressions and citation/UI checks. Baseline 352 pass/1 fail; final 382 pass, all four JS suites pass. All 244 production data/index hashes unchanged. No provider calls, indexing or embeddings. Current registry: one real PDF, 114 chunks, no earlier version or extracted-rule cache. Known validator/extraction/benchmark limitations and prioritized fixes are documented in docs/PROTOTYPE_REALITY_CHECK.md. The runtime server/browser must reload source changes.

## 2026-11-16 — Align evaluation with Dell PS1

Improved the existing benchmark with paired Raw/HyDE reciprocal-rank wins/ties/losses, actual HyDE text/usage observations and explicit exclusion of missing/error/fallback pairs. Ties and incomplete runs no longer declare a unique best mode; HyDE fallbacks flag errors. Kept aggregate service metrics labelled separately. Added five regression cases; full suite 387 passed. No live evaluations or index/provider changes. Real personal workspace has no benchmark questions or verified labels yet. Next steps and acceptance criteria: docs/PS1_RELIABILITY_EVALUATION.md.

## 2026-11-16 — Begin PS1 evaluation with actual-source question review

Prepared evaluation/ps1 with 30 pending questions (10 direct, 10 informal, 5 multi-condition, 5 out-of-scope), exact PDF source quotes and proposed reconstructed chunk targets. Source hash matches personal registry; offline reconstruction yields 114 chunks. 22 whole-quote mappings, 3 multi-condition fragment mappings flagged for review. Proposed split fixed before scoring: 12 development/18 holdout. Added manifest and offline draft checker. No labels verified, live retrieval/provider calls, embeddings or production indexing performed. Human review requested before accuracy scoring. This is a question-held-out evaluation proposal on one document, not unseen-document validation.

## 2026-11-16 — Actual diagnostic baseline execution (partial, network blocked)

Added evaluation/ps1/run_diagnostic.py and render_diagnostic.py. Executed actual PDF extraction, 114-chunk isolated local embedding/index setup, Raw retrieval and HyDE retrieval attempt for ps1-02. Raw retrieved page 10 at cosine 0.783; HyDE provider connection failed and fell back to the identical Raw ranking. Answer generation failed with provider_unavailable in both saved observations; no generated answer is claimed. Stopped restricted-network run; automatic approval review rejected the network-enabled retry because configured Gemini fallback was not clearly covered by prior Groq authorization. Asked for explicit destination authorization. Saved actual JSON, prompt/call records, full retrieved text/scores, errors and terminal output in evaluation/ps1/runs/diagnostic-2026-11-16. No product logic changed and no accuracy scoring or label verification occurred.

## 2026-11-16 — Completed actual Groq-only diagnostic baseline

User explicitly authorized Groq only, fallback disabled in isolated runner. Nine actual attempts (3 attendance questions × Raw/HyDE/Fusion), disposable 114-chunk index. Six citation_check_failed abstentions; three provider_unavailable outcomes. Observed nonstandard 【C1】 citations, visibly truncated answers consuming all 350 output tokens, invented numeric HyDE details and a logged 429 TPM error. Informal query ranks page 11 first under Raw/Fusion versus page 10 under HyDE; this is an observation, not verified accuracy. Full prompts/raw responses/evidence/scores/errors saved in evaluation/ps1/runs/groq-only-2026-11-16. All 244 production data/index hashes match. No application fixes, provider-config edits or label approvals. Two previously proposed holdout questions were inspected diagnostically and must no longer be called untouched holdout. See FINDINGS.md for limitations and next diagnostic recommendations.

## 2026-11-16 — RAG reliability engineering and actual reruns

Archived full request at evaluation/ps1/RELIABILITY_REQUEST.md. No Git metadata exists; backed up starting application files. Implemented strict citation canonicalization, finish/reasoning metadata and truncation withholding, generic event/clarification cues, fact-averse HyDE prompt/checks, and bounded process-local Groq token reservation/error detail. Low reasoning effort for GPT-OSS family only; model/output caps/endpoints/provider order unchanged. Baseline 387 pass; focused initial tests 3 failed/3 passed; final 396 pass. Nine paced actual Groq-only reruns: zero accepted, four unsupported qualifications/claims, two NO_POLICY_FOUND, one quote failure, two length-limited outputs. No provider-unavailable outcomes after 61-second pacing. Complete medical-condonation answering remains unresolved; do not claim success. All 244 production hashes identical. Every changed file/function, deferred work, exact metadata and report links: docs/RAG_RELIABILITY_ENGINEERING.md. No canned answers or relaxed grounding introduced.

## 2026-11-16 — Explain actual threshold rejection and missing-policy response

Exact prompt inspection corrects previous interpretation: ps1-14 Raw/Fusion sent only B11. Attendance, not B11.4. Heading-as-provision selection plus exact-word tie-breaking discarded the relevant rule after successful retrieval. ps1-02 rejection combines uncited opening claim and omitted qualifications; percentages themselves are supported. ps1-21 additionally exposes brittle paraphrase matching. Corrected offline diagnostic displays to canonicalize citations and not treat NO_POLICY_FOUND as a factual claim; raw responses/application outcomes unchanged. No application changes or new calls. Details: docs/ATTENDANCE_REJECTION_EXPLANATION.md.

## 2026-11-16 — Implementation order step 1: provision selection

Regression-first: five new tests reproduced heading-only selection and wrong provision ties. Removed non-substantive numbered candidates and added generic event/illness vocabulary to provision scoring. Actual failed ps1-14 retrieved block now sends full B11.4 with unchanged citation/page mapping. Focused 47 pass, full 401 pass, six dependency warnings. All 244 production file hashes unchanged; no live calls or database/embedding writes. Files, commands and remaining limitations: docs/PROVISION_SELECTION_FIX.md. Complete answering is not yet established; diagnostics/generation/validator improvements remain next.

## 2026-11-16 — Complete remaining reliability steps and final rerun

Added structured validation failures to trace/UI; bounded evidence-size output allowance and exact-source generation; generic deadline synonym/Unicode quotation matching; request-scoped HyDE generation sharing in compare; empty evidence selection/citation-order consistency; conservative verbatim source-condition completion only for otherwise-valid quotation-only answers. Final real Groq-only 3×3 diagnostic: 8/9 application responses accepted, informal Fusion withheld for quote mismatch, no provider unavailable, 3 explicitly logged Raw fallbacks. This is not independent model-answer accuracy: final accepted answers may append exact source conditions with disclosure, raw outputs are separately retained. Full suite 408 pass; 244 production hashes identical. Fresh holdout review sheet prepared, but no label approvals/official accuracy claims. Full changed-file list, test commands, limits and actual records: docs/PS1_COMPLETION_ROUND.md. Final run: evaluation/ps1/runs/reliability-completed-2026-11-16. Earlier partial debugging runs remain explicitly interrupted.

## 2026-11-16 — Professional workspace UI upgrade and local help

Frontend-only refresh across all 13 views: shared surfaces/typography/spacing, sidebar icons, page header, keyboard quick navigation, overview shortcuts, product Help chatbox, copy feedback, back-to-top and reduced-motion animations. Help is transparently local product documentation, never prepared policy answers. Corrected inaccurate Fusion UI description without changing retrieval. Full suite 408 pass; four JS suites pass; read-only Playwright verification covers desktop/mobile light/dark and all views with no overflow/browser errors/mutation requests. Screenshots and exact scope/limitations: docs/UI_WORKSPACE_UPGRADE.md. Application changes only web/index.html and web/ui.js. No backend/provider/data/index writes.

## 2026-11-16 — Polish confirmation and retrieval controls

Replaced browser-native delete confirmation with themed modal and native retrieval dropdown with accessible radio cards. Kept actual delete APIs, mode values/default and backend unchanged. Added workspace-epoch guard after asynchronous confirmation. Full suite 408 pass; expanded browser checks pass desktop/mobile light/dark with zero mutation requests; screenshots inspected. Details and exact changed files: docs/UI_CONTROL_POLISH.md.

## 2026-11-16 — P0 Step 1 only: quotation attribution

Added exact PS1-14 Fusion raw-response regression. Each quote now requires its own adjacent same-line citation; no look-ahead/prior-label inheritance. Individual missing_quote_citation / invalid_quote_citation / quote_mismatch reasons retained. Only answer citation-placement instructions changed; no retrieval/HyDE/grounding relaxation. Tests: new before 9 fail/1 pass; targeted after 66 pass; full 418 pass. Actual single PS1-14 Fusion Groq rerun: five individually cited matching quotations, answered, no supplementation/fallback, stop; 949 input/296 output/88 reasoning tokens. Current production manifest 237 files byte-identical before/after; historical 244 discrepancy (7 personal files absent and 2 historical hash differences) already present at start, so do not claim full historical identity. Holdout untouched. Full exact files/raw output/limits: evaluation/ps1/runs/p0-quotation-attribution-2026-11-16/FINDINGS.md.

## 2026-11-16 — Ten-question source review, freeze and real exploratory evaluation

Reviewed the original policy provisions and froze AI-assisted (not human-approved) ten-case labels/rubrics before execution. Improved runner pre-merge capture, settings/code/label hashes, alternative evidence-group mapping, balanced mode order and separate raw/final metrics. Corrected benchmark clarification denominator. Executed 30 actual Groq-only attempts on disposable 114-chunk index: Raw 4 accepted/5 abstain/1 clarify; HyDE 3/6/1; Fusion 3/6/1. Eight Raw fallbacks; 9 accepted answers source-completed. Genuine paired mapped Raw/HyDE subset n=3: 0 HyDE wins, 2 ties, 1 loss. No semantic accuracy claim. Human grades remain pending; two evidence mappings incomplete. Actual outputs reveal relevance/claim-unit/completeness issues; no application tuning during run. Full suite 422 pass; all 237 starting production hashes identical. See docs/FROZEN_TEN_EVALUATION_EXECUTION.md and evaluation/ps1/runs/frozen-ten-ai-reviewed-2026-11-16/RESULTS.md. The revealed set cannot serve as untouched evaluation after future tuning.

## 2026-11-16 — General evidence selection and answer grounding

Implemented complete-provision selection with explicit source/unit IDs, strict literal rendering, same-client question-coverage review, review-bound cache validation, isolated page-continuation handling and separate review usage/diagnostics. Removed broad automatic supplementation from production generation. Initial regressions reproduced five failures; two later tests reproduced zero-keyword context loss and trailing-parenthetical exclusion. Final suite: 451 pass; four frontend suites pass. Real Groq-only development checks: full B11.4 answered after explicit-ID selection; reinstatement answered after preserving B8.2 in context; late-fee/deadline recall failure remains a safe abstention. Earlier partial generation and 429 result retained. No held-out accuracy/superiority claims or human label approvals. Original PDF, frozen labels and all 237 starting protected files unchanged; embeddings only in removed disposable indexes. Exact modified files, raw outputs, test commands, costs and remaining limitations: docs/GENERAL_ANSWER_GROUNDING.md.

## 2026-11-16 — Four refinement foundations and corrected failure diagnosis

Completed offline original-PDF/trace diagnosis, explicit question coverage ledger with v3 cache proofs, 12-case human-review packet with blank labels, offline reviewer scorer, unseen-document comparison protocol and freeze/drift preflight. Corrected prior late-semester-fee recall claim; actual summer-rule failure was context loss with both targets at rank 1. Ranking/provider settings unchanged. One Groq-only review smoke returned a negative verdict and missing Q1/Q2; preserved as development regression, not human-labelled accuracy. Final suite 476 pass; four frontend suites pass. No ingestion/embedding generation or held-out execution. Human review, independent PDFs and final-runner preflight wiring remain pending.

Integrity differs from the starting 237-file snapshot: 235 originals unchanged, two changed (personal registry/shared Chroma), six added synthetic-demo files; live server logs show successful demo API activity, caller unconfirmed. No cleanup/rollback/shared-DB inspection. Original PDF and frozen labels remain unchanged. Exact changes, observations, protocols and limitations: docs/RELIABILITY_REFINEMENTS.md.

## 2026-11-17 — Document Changes loading and partial-extraction fix

Observed 33/47 candidate chunks in extraction while the UI displayed only Working. Added existing-activity polling, duplicate prevention, bounded requests, actionable errors and blocked-versus-empty-result handling. Fixed provider-failure completion fallthrough; saved batch IDs support resumable retries and partial caches cannot be compared. Legacy caches retain validated rules but require completion rechecking. Tests: 481 pass; new frontend behavior checks pass and run in the full suite. Restarted local server successfully (HTTP 200). No live LLM test, ingestion, embedding generation or PDF change. Exact scope/limits: docs/DOCUMENT_CHANGES_FIX.md.

## 2026-11-27 — CampusDecoded rename and Render preparation

User selected CampusDecoded, authorized GitHub repository rename and website branding, and chose a free temporary Render demo. Repository renamed to Shreshth114/CampusDecoded. Added host/port/worker deployment configuration, opt-in data/model-cache paths, a temporary-storage disclosure, version constraints and model-cache build helper. No local datasets, credentials or indexes are migrated. Render workspace confirmed by user. Cloud deployment/secret configuration and memory checks remain pending; see docs/RENDER_DEPLOYMENT.md for concrete scope and results.

## 2026-11-27 — CampusDecoded live

Repository and website renamed; PR #4 merged. Free Singapore Render service is live at https://campusdecoded.onrender.com. User-authorized local Groq/admin environment values transferred privately. 484 Python tests pass; hosted synthetic upload/index/chunk/real Groq answer/admin auth checks pass and test workspace was deleted. No local real-policy dataset migrated and no paid resources created. Free storage remains ephemeral. Full results and limitations: docs/RENDER_DEPLOYMENT.md.
