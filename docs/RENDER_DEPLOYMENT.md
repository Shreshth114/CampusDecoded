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

The old Groq credential pasted in the conversation should be replaced before public use. The agent does not copy it to public hosting. A deployed service without a Groq key can serve the UI and documents but cannot produce AI answers or extract AI rule tables; that is not a fully configured launch.

The Blueprint supports generated admin secrets and manual provider secrets. If service creation uses the connector directly instead of the Blueprint, those secrets must be added privately afterward. No secret value is written into these deployment files.

## Verification and limits

Run all Python/DOM tests, then verify the public homepage, health endpoint, CampusDecoded branding, temporary-data notice, synthetic upload/index/chunk inspection and scoped cleanup. A successful AI-answer check requires the privately configured provider key. Keep synthetic smoke workspaces separate from real institutional policies and never approve them.

Name and branding changes retain existing localStorage keys so browser workspaces are not deliberately reset. New hosted origins have separate browser storage. No migration, re-indexing or approval of local datasets is performed.

Deployment status and actual cloud build/test results will be appended after Render reports them. No live URL or successful deployment is claimed before verification.

Official references: [FastAPI deployment](https://render.com/docs/deploy-fastapi), [free-tier storage behavior](https://render.com/docs/free#local-files-lost-on-redeploy), [persistent disks](https://render.com/docs/disks), [Blueprint fields](https://render.com/docs/blueprint-spec).
