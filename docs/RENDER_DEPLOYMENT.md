# CampusDecoded on Render — free temporary demo

The repository is https://github.com/Shreshth114/CampusDecoded. This deployment uses the existing FastAPI app, one worker and local FastEmbed/Chroma. It does not replace the backend with a static mock.

## Approved scope

Free service only. No paid disk, database, worker or upgrade is authorized. Render free filesystems lose uploads, workspace registries, caches and indexes on restart, redeploy or idle spin-down. The UI exposes a temporary-storage notice via health metadata. Keep original PDFs. A public deployment starts empty; no local university PDFs, credentials, personal workspaces or databases are transferred.

## Configuration

- Native Python runtime; `.python-version` selects 3.14 (locally tested on 3.14.9).
- Build: `pip install -r requirements.txt -c constraints-render.txt && python scripts/cache_embedding_model.py`.
- Start: `uvicorn src.server:app --host 0.0.0.0 --port $PORT --workers 1`.
- Health: `/health` (no embedding download or LLM call required).
- `CAMPUS_DATA_DIR=/tmp/campusdecoded/data` stores all institution/personal workspace files.
- `CHROMA_DIR=/tmp/campusdecoded/chroma`; the existing store resolves its collection directory to `/tmp/campusdecoded/.chroma-institutions`.
- `CAMPUS_STORAGE_MODE=ephemeral` enables the visible data-loss notice.
- `FASTEMBED_CACHE_PATH=/opt/render/project/src/.cache/fastembed` shares build-cached public model files with runtime. No policy is embedded during build.
- Batch size 1 and LLM concurrency 1 reduce peak resource demand without changing the embedding model, thresholds, prompts or retrieval modes.

The free instance has limited memory. Cloud upload/index/answer behavior must be tested after deployment; local tests or a healthy homepage alone do not establish that embeddings fit. Never silently upgrade to paid compute on a memory failure.

## Secrets

Set `GROQ_API_KEY`, `GROQ_MODEL` and a strong random `ADMIN_API_TOKEN` privately in the service's Render Environment page. Do not commit them or paste secret values into chat. Gemini credentials are optional; without them it is not a configured fallback. The application fails closed for admin operations if its token is missing.

Rotation of the previously pasted key was recommended. The user explicitly instructed transferring the existing local environment values instead; GROQ_API_KEY, GROQ_MODEL and ADMIN_API_TOKEN were transferred privately to Render without displaying or committing their values. A deployed service without a Groq key can serve the UI and documents but cannot produce AI answers or extract AI rule tables; that is not a fully configured launch.

The Blueprint supports generated admin secrets and manual provider secrets. If service creation uses the connector directly instead of the Blueprint, those secrets must be added privately afterward. No secret value is written into these deployment files.

## Verification and limits

Run all Python/DOM tests, then verify the public homepage, health endpoint, CampusDecoded branding, temporary-data notice, synthetic upload/index/chunk inspection and scoped cleanup. A successful AI-answer check requires the privately configured provider key. Keep synthetic smoke workspaces separate from real institutional policies and never approve them.

Name and branding changes retain existing localStorage keys so browser workspaces are not deliberately reset. New hosted origins have separate browser storage. No migration, re-indexing or approval of local datasets is performed.

Deployment status and actual cloud build/test results will be appended after Render reports them. No live URL or successful deployment is claimed before verification.

Official references: [FastAPI deployment](https://render.com/docs/deploy-fastapi), [free-tier storage behavior](https://render.com/docs/free#local-files-lost-on-redeploy), [persistent disks](https://render.com/docs/disks), [Blueprint fields](https://render.com/docs/blueprint-spec).

## Verified deployment — 27 November 2026

- Live app: https://campusdecoded.onrender.com
- GitHub: https://github.com/Shreshth114/CampusDecoded
- Branding/deployment PR #4 was merged; application commit `e62c9459584414c11532abf7297c1068c12a92ff`.
- One free Python web service was created in the confirmed workspace, Singapore region. No other Render services were changed; no paid resources were created.
- Initial build downloaded dependencies and the configured BGE embedding model successfully. The environment-variable update triggered its own redeploy; no duplicate manual deploy was requested.
- Final credentials-enabled deployment `dep-dc4n40nl9n4c73fhuur0` reported live.
- Local suite: 484 Python tests passed, six dependency warnings. All five existing frontend/DOM suites passed.
- Public homepage: HTTP 200, CampusDecoded title. Public health: HTTP 200, ephemeral storage and configured Groq. `/.env` and `/src/config.py` returned 404.
- Admin authentication from the local private token returned HTTP 200 without displaying the token.
- A separate clearly labelled synthetic workspace uploaded one synthetic PDF, indexed successfully in 10.5 seconds, exposed its one stored chunk, and produced a real Groq Raw-mode answer with verified citations and the fixture's expected value. The synthetic workspace was deleted successfully (HTTP 200).
- This is a functional deployment smoke check, not a university-policy accuracy benchmark or a Raw/HyDE/Fusion comparison. Large-document memory/concurrency performance is not established by one small fixture.
- The service was created through the connection's web-service API. That API currently omits the health-check-path field, so Render's default port-level check applies; the actual `/health` endpoint was verified independently. The Blueprint specifies `/health` if used for a future managed service. Secret generation in that Blueprint was not used; the user-authorized local secrets were installed privately.

Local private PDFs, registries and Chroma indexes were not transferred. Render begins with fresh workspaces. Free-tier data can disappear on idle spin-down, restart or redeploy, as disclosed in the app. Keep original documents. No paid upgrade is implied or authorized.

Documentation-only publication commits use Render's documented `[skip render]` marker so they do not unnecessarily restart the ephemeral demo.
