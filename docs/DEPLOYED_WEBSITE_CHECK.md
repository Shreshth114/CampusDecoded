# Deployed CampusDecoded verification

Checked 27 November 2026, 05:47:31 PM IST through 27 November 2026, 05:48:40 PM IST.

Live site: https://campusdecoded.onrender.com
GitHub: https://github.com/Shreshth114/CampusDecoded

**34/34 functional checks passed.** This is a synthetic deployment smoke test, not a university-policy accuracy benchmark or proof that all inputs/features are correct.

| Check | Result | Observed detail |
| --- | --- | --- |
| Homepage and branding | Pass | 200 |
| Navigation/theme/help controls | Pass | "Required controls exist; not visual browser QA" |
| Asset /app.js | Pass | 200 |
| Asset /personal.js | Pass | 200 |
| Asset /ui.js | Pass | 200 |
| Asset /demo.js | Pass | 200 |
| Health and configured Groq | Pass | {"status": 200, "storage": "ephemeral"} |
| Private environment file blocked | Pass | 404 |
| Admin requires authentication | Pass | 401 |
| Admin authentication | Pass | 200 |
| Upload fixture A | Pass | 200 |
| Index fixture A | Pass | {"status": "ok", "errors": 0} |
| Stored chunks A | Pass | {"status": 200, "total": 1} |
| Original PDF preview | Pass | 200 |
| Grounded Raw answer | Pass | {"decision": "answered", "reason": null, "provider": "groq"} |
| Citation details | Pass | 200 |
| Upload fixture B | Pass | 200 |
| Index fixture B | Pass | {"status": "ok", "errors": 0} |
| Stored chunks B | Pass | {"status": 200, "total": 1} |
| Foreign workspace blocked: chunks | Pass | 404 |
| Foreign workspace blocked: original | Pass | 404 |
| Foreign workspace blocked: citation | Pass | 404 |
| Empty workspace abstains | Pass | "no_chunks_retrieved" |
| Empty input rejected | Pass | 422 |
| Raw/HyDE/Fusion retrieval comparison | Pass | {"raw": {"chunks": 2, "raw_fallback": false}, "hyde": {"chunks": 2, "raw_fallback": false}, "fusion": {"chunks": 2, "raw_fallback": false}} |
| Rule extraction A | Pass | {"status": "complete", "rules": 1, "errors": []} |
| Rule extraction B | Pass | {"status": "complete", "rules": 1, "errors": []} |
| Rule Book | Pass | {"rules": 2} |
| Policy conflicts | Pass | {"conflicts": 1} |
| Version catalogue | Pass | {"versions": 2} |
| Document Changes | Pass | {"status": "completed", "changes": 1} |
| Benchmark status endpoint | Pass | 200 |
| Synthetic workspace cleanup 1 | Pass | 200 |
| Synthetic workspace cleanup 2 | Pass | 200 |

## Monitoring and scope

Render reported the credentials-enabled deployment live. Sampled memory usage was approximately 377 MiB against a 512 MiB limit during this period; this is not a peak-memory or concurrency test. The error-log query did not yield usable structured data, so it is not used as proof of zero errors.

All uploads and rules belonged to two disposable, explicitly synthetic test workspaces. Both were deleted successfully. Real user documents, institution approvals and benchmark labels were not changed. No credentials, workspace capabilities or document IDs are stored in this report.

Raw/HyDE/Fusion returned evidence with no Raw fallback in this run. The real answer check used Raw mode. This does not establish retrieval superiority or answer correctness on real campus policies.

Not covered by this live run: full browser visual/mobile/theme interaction, large PDFs, OCR, sustained traffic/concurrency, the complete institutional upload/approval/publication flow, what-if interactions or independent benchmark accuracy. Local automated tests cover additional logic but are not a substitute for those live checks.

Render remains a free temporary demo: uploads/indexes can disappear on restart, redeploy or idle spin-down. Keep original documents.

After the passing checks, the repository homepage field (GitHub About → Website) was set to https://campusdecoded.onrender.com. No source-code changes or service restart were needed for that metadata update.
