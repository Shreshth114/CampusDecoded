# Implementation decisions and verification limits

Updated 2026-11-13. The current user request governs this work; the build guide and architecture audit are design references. Their historical approval gate, overnight schedule, PDF prerequisite, deprecated SDK suggestion and evaluation-only decoy flag do not override the current instruction to continue safely without university PDFs.

## Architecture and safety

- **D-001 — Separate adapters.** Groq uses OpenAI-format HTTP; Gemini uses `google-genai`. Both have timeouts. The shared client retries transient HTTP/SDK errors, then fails over. SDK-internal retries are disabled to avoid multiplying retries. Adapter contracts and failover are tested with mocks; neither live provider is configured here. Run `python scripts/check_providers.py --live` after setting keys and model names. Model availability, quotas and real latency remain unverified.
- **D-002 — Confidence is cosine, not rank.** Chroma distance becomes `max(0, min(1, 1 - distance))`; nonfinite distances become zero. Raw/HyDE retain their cosine scores. Fusion ranks by reciprocal-rank fusion, stores RRF separately and preserves the best observed cosine for each result. Raw fallback is not counted twice as independent evidence. This confidence heuristic is not a calibrated probability.
- **D-003 — Production cache is conservative.** Only near-exact text normalization is used in production; negation, apostrophes and numeric punctuation are preserved. Each entry is bound to cited file hashes and chunk text hashes, and eligibility is rechecked on lookup. Stale, rejected, deleted or edited sources cannot be served from cache. Semantic lookup is restricted to explicit nonproduction calls and remains experimental, even if enabled by environment configuration. Its real false-hit rate has not been measured.
- **D-004 — Explicit source review.** New or changed sources are pending. Human approval is bound to the registered file's SHA-256 hash; current file content is checked during retrieval. Approval does not automatically establish institutional authenticity: a reviewer must inspect the official origin, institution, applicability and dates. Legacy hashless approvals fail closed. `manage_sources.py` provides list/approve/reject commands and synchronizes index metadata without embedding unchanged files.
- **D-005 — Decoy and fixture isolation.** Production requires approved metadata, a matching live registry entry and content hash, and exclusion of decoy/synthetic flags. Decoy IDs are namespaced to prevent same-filename replacement. Synthetic review-state emulation exists only in temporary test registries and databases; it does not certify any university policy. The freshness demo uses explicitly synthetic markers, deterministic fixture vectors and a temporary Chroma directory; it never edits production PDFs.
- **D-006 — Safe local writes.** Changed files are parsed and embedded before index mutation. Short document replacements hold a shared lock; failed upserts restore the previous document. Failed extraction/embedding leaves the old index and manifest entry available for retry. JSON writes use atomic replacement; cache, registry and indexing have local-process locks. Queries can use existing eligible documents during embedding preparation. Run one server worker; these are not distributed locks or a cross-file database transaction.
- **D-007 — Faithfulness limits.** Excerpts and attributes are XML-escaped and the system prompt treats excerpt/question instructions as untrusted data. The answer model never receives a HyDE passage. Citation checks ensure valid references; they do not prove that each claim follows semantically from the excerpt. Mocked tests do not prove a live model resists every injection.
- **D-008 — Parsing and chunks.** Actual PDF page numbers and parser provenance are retained. Per-file low text yield triggers pdfplumber fallback. Unicode normalization preserves newlines for heading detection; short preambles and tails are retained; oversized sentences are split. Chunk sizes are character-based token approximations. No OCR or automatic table understanding is claimed. Unsupported/scanned documents produce empty extraction and an indexing error rather than fabricated content.
- **D-009 — API and dashboard.** Typed inputs reject wrong types, invalid modes and controls; questions truncate to 500 characters, request bodies are bounded at 8 KB, and POST requests have a bounded in-memory rate limit. Errors avoid exposing provider secrets. The UI escapes dynamic content, links citations to trace cards, separates cosine and RRF, and uses “Citation references checked,” not “Source verified.” Localhost and one worker are defaults. This is a local demonstration app, not a multi-user hosted service.

## Audit disposition

| Audit items | Disposition |
|---|---|
| C1, M2 | Separate configured adapters; mock integration tests; live verification requires keys/models |
| C2 | Distance conversion and separate fusion scores; boundary/nonfinite tests |
| C3 | Exact production cache with source-version validation; similar-but-different regression cases |
| S1 | Reranker remains deferred as the audit's optional stretch; no accuracy benefit claimed |
| S2 | Single-passage multi-topic limitation documented; no multi-HyDE expansion |
| S3 | RRF used for raw/HyDE; unused BM25 dependency removed |
| S4 | Bounded prompt/model-keyed HyDE cache, no-cache switch, slow benchmark mode, bounded retries |
| S5 | Typed API validation, limits, safe UI rendering and rate limiting |
| S6 | Staged index updates, shared locks, atomic JSON and rollback tests |
| M1, M3, M4 | SHA-256 IDs, extraction fallback provenance, Unicode normalization |

## Benchmark integrity

`bench/test_queries.jsonl` contains **25 candidate queries with unverified labels**, not a verified MSRIT benchmark. Their proposed document topics and out-of-scope expectations are hypotheses until reviewed. No labels were changed to verified.

The runner requires verified labels, an approved corpus and eligible gold chunk IDs before measuring. Otherwise it writes an explicit blocked-status report with **no accuracy measurements**. Recall@k is the fraction of gold chunks retrieved; hit@k is separately named; MRR uses the first gold rank. Failures count and remain visible. Infrastructure failures are not successful abstentions. Citation validity and the uncited-sentence heuristic are syntactic diagnostics, not semantic grounding accuracy. Threshold sweeps report retrieval acceptance and missing-gold proxies; they do not measure wrong-answer rates. Production-vs-unrestricted decoy observations are retrieval-only, not a controlled comparison of equal-authority corpora.

The framework produces JSON, Markdown, an SVG chart and dashboard views. Synthetic arithmetic tests are not exported as university benchmark results. No mode has been established as best for MSRIT.

| Parameter | Current default | Verification |
|---|---|---|
| Confidence threshold | 0.35 | Untuned starting value |
| Top-k | 5 | Untuned starting value |
| Chunk maximum | ~350 tokens / 1,400 body characters | Generic fixture bounds tested; real extraction inspection pending |
| Overlap | 12% | Untuned; character-based |
| Semantic cache threshold | 0.95 | Nonproduction experiment only; no real false-hit measurement |

## Open verification work

Actual MSRIT PDFs are needed for source-origin review, extraction/table inspection, applicability/date review, gold chunk labeling, real retrieval/abstention comparisons and threshold selection. Provider keys/models are needed for live adapter smoke tests, quotas and actual latency. BrowserOS tools are unavailable in this session; dashboard behavior is covered by the Node DOM harness, but visual browser QA has not been performed. Existing third-party deprecation warnings remain. No external accuracy, latency or free-tier quota claims are made.

## Final local verification

`python -m pytest tests/ -v`: **177 passed**, with six existing third-party deprecation warnings and no skipped tests. This includes ten JavaScript dashboard behavior checks through a Node DOM harness. Compilation and JavaScript syntax checks passed. See `docs/VERIFICATION.md` for scope and remaining external verification; none of these results measure MSRIT retrieval accuracy.

## Groq live diagnostic follow-up

The current saved `GROQ_MODEL` was the literal template comment `# pick via: python scripts/list_models.py`, producing HTTP 404 with `code: model_not_found` and message: “The model `# pick via: python scripts/list_models.py` does not exist or you do not have access to it.” A live model-list request returned 11 models, confirming the key authenticates; the endpoint is the expected Groq chat-completions endpoint.

A temporary `openai/gpt-oss-120b` override isolated a second smoke-test issue: at 32 tokens Groq returned HTTP 200, `finish_reason: length`, and no answer content; at 256 tokens it returned content with `finish_reason: stop`. The updated provider check passed live with that temporary model override. The saved `.env` was not changed, and neither HyDE nor answer-generation token limits were changed. This verifies a small adapter request, not policy accuracy or reliable budgets for real policy questions.

Targeted changes: sanitized HTTP status/body diagnostics in the CLI and unified-client logs; model identification and a 256-token smoke-test budget; separate comments from blank model assignments in `.env.example`. Regression tests check credential/header redaction and template parsing. Full suite: **187 passed**, six dependency deprecation warnings. Recommended configuration repair: explicitly select an accessible chat model ID in `GROQ_MODEL`, then restart and rerun the live check. `max_tokens` is deprecated in Groq's API reference but was accepted in these live tests; it was not the cause of the 404.

## Interrupted real-document ingestion follow-up

Ten actual PDFs are now present. Investigation used read-only extraction/chunking and a bounded 32-chunk inference probe, not an automatic indexing run. The interrupted state contains four committed/unapproved decoy vectors, a matching decoy-only manifest and a pending AEC registry entry with no AEC vectors. SQLite integrity checks passed, and fingerprints of 20 existing production-state files remained unchanged.

AEC extraction/chunking took 0.398/0.009 seconds; the observed interruption was inside ONNX inference. FastEmbed's implicit 256-text padded batch on an 8 GB machine with about 5 GB swap is the most likely bottleneck. `EMBED_BATCH_SIZE=8` now bounds inference memory; tokenizer, model, precision, chunking, source order and ONNX thread/provider defaults are unchanged. The same cached model ran successfully on Python 3.14.9 / arm64 / ONNX Runtime 1.32.0. Small-batch vectors closely matched the larger-batch reference; no real retrieval-accuracy claim is made.

Stage/batch/upsert progress and timings are now visible. Interruptions during commit roll back the previous document; embedding-stage interruptions leave the previous index/manifest unchanged. Three real files returned no text after fallback and require text-based sources or separately reviewed OCR. They are reported as errors, not silently counted as indexed. Full automated suite: **197 passed**, six dependency warnings. See `docs/INGESTION_DIAGNOSTIC.md` for measurements, modified files, state inspection, limits and the exact manual resume command. No existing data was deleted/reset, and ingestion was not started.


## Institution-independent implementation (2026-11-14)

- Immutable UUID context travels through ContextVar scopes and asyncio.to_thread. Explicit selection is mandatory; no institution default and no request-mutated global directories.
- JSON workspaces and a parallel scoped Chroma collection preserve the existing stack and legacy data. Local locks support one service process; concurrent CLI writers are prohibited. Shared-collection resets are disabled.
- Every production query intersects tenant ownership, current registry version/hash, physical-file hash, approval and non-synthetic/non-decoy flags. Evaluation relaxes approval only, never institution scope. Raw cosine remains independent from RRF.
- Versions use SHA-256 and preserve previous bytes/review history. Replacement immediately becomes pending; approval requires reviewer identity, issuer and source URL through the admin workflow. Unknown dates/applicability remain null.
- ADMIN_API_TOKEN provides one local operator with access to every workspace. No enterprise roles/SSO or remote-deployment security is claimed. Tokens are entered at runtime and kept only in page memory.
- Answer caches persist per workspace and check fingerprints/live evidence. HyDE cache is also institution scoped. All asynchronous view updates use an institution-generation guard; switching clears answer/source/trace state.
- The migration compatibility check recomputed eight representative excerpts, never the full corpus. Existing vectors were reused unchanged as insertion input; Chroma readback normalization introduced at most 2.98e-8 float32 component rounding, explicitly measured and bounded at 1e-7. Exact original arrays and legacy files remain backed up.
- Benchmark labels remain unverified and no measured accuracy was invented. BrowserOS neo MCP is unavailable in this session, so visual browser QA is an explicit remaining verification item.


## UI onboarding correction (2026-11-14)

Keep student publication filtering intact. Separate the public selector from an authenticated administrator selector that includes private workspaces. Explain the one-private-workspace/zero-public-workspaces state instead of publishing or approving data automatically. Generate slugs from names and reject duplicate names to avoid accidental duplicate demonstration workspaces. Preserve student selection on entry. Upload & index performs explicit scoped indexing only for submitted documents and retains pending approval. Preview originals through authenticated fetch/blob URLs; tokens never enter URLs or static assets. Live end-to-end evidence uses a disposable synthetic review-state instance with real embeddings and Groq, never real-source approval.


## Student-first personal platform (2026-11-14)

- Anonymous IDs have 256 random bits; possession grants access. Store only in localStorage and transmit as X-Workspace-ID, not a workspace URL. No accounts, recovery, public listing or administrator access is implied. Capability values are stripped from explanation-model payloads.
- Separate personal registry/workspace paths and mandatory workspace metadata filters reuse the existing stack. Personal uploads are eligible unverified evidence after successful indexing/current-hash validation; they never acquire institutional approval. Institutional approval/publication rules remain intact.
- Limits: PERSONAL_MAX_FILE_MB=30, PERSONAL_MAX_PAGES=200, PERSONAL_MAX_DOCUMENTS=20, five files per upload request. Real PDF parsing precedes storage; scans may fail extraction; no OCR or silent chunk skipping is added.
- Existing confidence threshold 0.35 remains untuned. Similarity is raw cosine (1-distance); RRF only ranks. Exact answer caching remains default; semantic cache stays experimental/off. Source fingerprints, ownership/current versions and live file hashes gate cache hits.
- Rules use exact source substrings, numeric occurrence, expressed operator/unit and lexical subject checks. These guards do not prove complete semantic extraction or authenticity. A literal numeric-rule subset is supported; no formulas/categorical universal policy engine is invented. Rule cache binds workspace, document/hash, prompt and model.
- Confirmed student facts and applicability are prerequisites. Decimal code decides statuses; missing facts/units, exceptions or conflicts yield insufficient evidence. Overall conclusions concern displayed conditions only. AI explanations cannot replace computed verdicts and may be discarded for unsupported numbers/verdict language.
- Conflicts are possible, grouped by extracted subject; dates do not select a winner. Version diffs compare extracted tables, not official applicability or complete documents. Historical originals remain owned but are excluded from current retrieval.
- Benchmarks accept user-supplied, manually verified personal labels. No labels, benchmark scores or real-world accuracy were generated. HyDE caches are scope/prompt/model-bound for economical reruns.
- BrowserOS neo tools are unavailable; API, DOM and live-model observations are recorded separately from visual browser QA. Local single-process storage remains the MVP; no deployment or infrastructure was added.

## Incomplete held-out HyDE experiment

No candidate is promoted from the `improve_hyde/` experiment. A Raw-only TUNE baseline on 23 machine-labelled cases is insufficient for choosing a default. The available Groq daily-token quota prevented completion, and empty-content provider responses were also observed. Preserve the personal Fusion default and confidence threshold 0.35 until frozen held-out candidates and end-to-end safety checks pass. Experimental combinations are confined to the disposable research runner, not production API modes.

## Path to Eligibility

The new workspace-scoped what-if endpoint reads current quote-validated rules and reuses the existing Decimal evaluator. Scenario facts and optional counts remain in memory, with no model calls, persisted facts, answer-cache writes or invented policy parameters. The request supplies selected analysis rule IDs and explicit confirmation/applicability flags. These flags remain user assertions, consistent with analysis; there is no server-side record proving that the client previously completed analysis. A missing or foreign/stale rule ID is rejected.

For lower-bound percentages, additional fully completed items use ceil((threshold × total − 100 × done)/(100 − threshold)); strict comparisons use floor plus one. Other operators are solved separately; exact equality has no direct numeric gap. Counts require integral done ≤ total, positive total and optional nonnegative remaining. Percentage facts are bounded to 0–100; generic facts to 0–1e12 with at most 24 decimal places, counts to 1e9. Decimal count operations use 80-digit precision; display shortening is explicitly marked ≈. Conflicts suppress the combined verdict and paths. Missing facts, unit mismatches, unconfirmed applicability and unresolved exceptions retain insufficient evidence.

This is arithmetic on extracted thresholds. It cannot establish institutional eligibility, authorize an exception, infer counting conventions or determine cut-off dates or rounding policy. Source applicability and exceptions remain quoted caveats. The synthetic demo uses fixture analysis and blocked providers; live extraction quality and real policy applicability are outside this feature's verification.

### 2026-11-14 — Personal chunk merging uses provenance, not textual deduplication

Merge source spans from the same page/section by original character offsets. Do not guess overlap from matching sentences, since policy documents may repeat legitimate text. Do not merge across pages while the Chunk schema has only one source page. Retain split numbered headings as one heading. The NIT Goa correction is verified offline only: user chose not to update the shared live database. See docs/NIT_GOA_CHUNKING_FIX.md.

### 2026-11-14 — Exact sent evidence is the validation boundary

Use complete numbered provisions within the existing chunk-size budget; oversized evidence abstains before generation. Both fresh and cached answers must pass the same conservative citation/quote/clause/qualification validation against recorded sent excerpts. Legacy caches without those excerpts miss safely. Deterministic validation deliberately favors exact source wording over broad paraphrase acceptance; it is not a semantic-entailment guarantee. Diagnostics require explicit local opt-in and redact credentials/capabilities. Details: docs/ANSWER_GROUNDING_FIX.md.

### 2026-11-16 — Production routes must not return prepared demo results

Remove keyword-triggered fixed policy answers and the unauthenticated prepared comparison endpoint entirely. Preserve explicit isolated synthetic fixtures. Real answer modes must run the scoped pipeline or honestly report cache/provenance/abstention; document comparison must reflect actual selected versions. No fake confidence, approved-source, verification or latency fields. Defer broader validator/extraction redesign to the evidence-backed repair plan in docs/PROTOTYPE_REALITY_CHECK.md.

### 2026-11-16 — Failure classification before answer acceptance

Retain Groq finish_reason and reasoning_tokens; withhold length-limited answers. Use low reasoning effort only for configured GPT-OSS-family Groq models, preserving model identity/token caps/provider order. Bound process-local Groq token reservations by an overridable observed quota and existing wait budget; distinguish local/provider unavailability from missing evidence. Keep all substantive grounding checks after citation canonicalization. Intent cues are generic events, never prepared policy answers. Rerun artifacts disclose changes and continuing failed answers.

### 2026-11-16 — A section title cannot substitute for evidence

Numbered provision selection must exclude heading-only candidates before lexical ranking. Reuse lightweight event vocabulary for selecting evidence as well as retrieval, without adding policy facts or altering source text. Keep bounded complete provisions and fail closed when no substantive candidate fits. Verified against the actual recorded failed context; see docs/PROVISION_SELECTION_FIX.md.

### 2026-11-16 — Complete evidence coverage before broad paraphrase or retrieval claims

Prefer model-selected exact source quotations and a bounded source-size output allowance. Retain strict qualification validation and length rejection. Add only tested generic deadline aliases. Share in-flight HyDE generation inside a comparison request, scoped by existing workspace/model/prompt key, never across workspaces. Fresh final questions need explicit human relevance decisions; inspected diagnostic cases cannot become held-out evidence.

### 2026-11-16 — AI-assisted frozen evaluation is not human verification

User requested review and execution of the ten fresh cases. Preserve AI reviewer provenance, keep labels_verified=false and human grades pending. Freeze questions/rubric before real calls; resolve alternative evidence requirements before retrieval; keep incomplete mappings explicit. Score raw outputs and final source-completed outputs separately. No mode-superiority claim from different eligible subsets, Raw fallbacks or tiny samples. Details: docs/FROZEN_TEN_EVALUATION_EXECUTION.md.

## 2026-11-16 — Controlled extractive answers and coverage review

Choose explicit complete source-provision selection over free-form policy generation. Deterministic rendering preserves numerical conditions and source attribution; incomplete/nonliteral units are withheld. Preserve complete units from a retrieved block even without exact query-word overlap when the existing total budget permits. Do not append unrelated conditions to repair the model's output.

Use an additional same-client model review for relevance and multi-part coverage after deterministic checks. Its verdict is fallible; malformed/negative/truncated reviews fail closed. Track its tokens/latency separately. Cache only answers with a matching question/evidence/scope/prompt-bound review record, while retaining live source-version checks. Legacy cache entries miss without deleting production cache files. Provider configuration and retrieval algorithms remain unchanged. Trade-offs and honest remaining recall/layout/evaluation gaps: docs/GENERAL_ANSWER_GROUNDING.md.

## 2026-11-16 — Coverage ledgers and evaluation gates

Trace evidence corrected an earlier diagnosis: the later late-semester-fee question lacked identified supporting evidence; the genuine summer-registration failure retrieved both provisions at rank 1 and lost the fee provision during old context selection. Keep those cases distinct and do not tune retrieval to an unsupported assumed answer.

Require explicit coverage rows for literal question spans plus the whole question, backed only by selected source units. Cache protocol v3 rejects old Boolean-only proofs. This adds structural accountability, not semantic entailment. Human-review fields and scorer remain unscored until genuine adjudication. Freeze tooling rejects pending/exposed inputs and verifies hashes/settings drift; it does not approve institutional sources or execute a benchmark. Existing diagnostic execution is not a final human-reviewed benchmark wrapper.

Final tests: 476 pass. A concurrent live demo API request accompanied two changed protected files and six additions; no rollback or full integrity claim. Frozen ten-case labels and the original PDF still match their manifests. Evidence and remaining limits: docs/RELIABILITY_REFINEMENTS.md.

## 2026-11-27 — CampusDecoded free-demo hosting

Preserve the existing app and retrieval behavior. Route deployment storage using an opt-in environment path while retaining original local defaults. Use one worker for JSON/Chroma safety. Free Render storage is explicitly ephemeral, with visible UI disclosure; no paid resources or persistence promise. Public hosting starts empty and never receives protected local documents/indexes. Cache the same public embedding model during build and use batch size 1 to limit resource peaks. Cloud memory/AI-function checks are separate from homepage health. Secrets must be configured privately; do not reuse the credential previously pasted in chat for public deployment.
