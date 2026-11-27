# CampusDecoded

An institution-independent prototype for finding campus rules in uploaded documents and answering student questions with cited evidence.

The application combines a FastAPI backend, a browser dashboard, local text embeddings and Chroma vector storage. It supports Raw retrieval, HyDE search expansion and reciprocal-rank Fusion. Generated HyDE text is a search key; it is never authoritative answer evidence.

## Local setup

Use an isolated Python environment. The latest local verification used Python 3.14; other Python versions have not been verified for this snapshot.

```sh
git clone https://github.com/Shreshth114/CampusDecoded.git
cd CampusDecoded
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Set `GROQ_API_KEY` in your local `.env`, then list available models:

```sh
python scripts/list_models.py groq
```

Set `GROQ_MODEL` to an available model ID. Groq can run without Gemini credentials; an unconfigured Gemini provider is unavailable as a fallback. Set a long random `ADMIN_API_TOKEN` if using institutional administration. Keep all credentials local.

```sh
python -m src.server
```

Open **http://127.0.0.1:8000**. Create a personal workspace and upload your own PDFs. Personal uploads remain unverified; institutional source verification and approval are separate administrative actions. A personal workspace ID is an access capability: treat it as private.

No university PDFs, personal uploads, live workspace registries, databases, credentials or prebuilt indexes are distributed. The first embedding-model use may download its weights. OCR is not implemented; scanned PDFs without extractable text require safe failure rather than invented evidence.

## Implemented components

- Workspace-scoped document upload, extraction, indexing, original/text/chunk inspection and source management.
- Raw, HyDE and Fusion retrieval with cosine confidence kept separate from RRF ranking scores.
- Complete-provision source selection, per-quotation citations, grounding checks and explicit question-coverage review.
- Source-version-aware cache validation and institution/workspace isolation.
- Rule extraction, stated-fact analysis, document comparison and development evaluation tooling.
- Light/dark dashboard and local product-help interface.

The interface and API are a prototype. See the documented limitations before treating its answers as decisions or permissions.

## Verification

```sh
python -m pytest tests/ -q
node tests/personal_frontend.test.cjs
node tests/sidebar_frontend.test.cjs
node tests/frontend.test.cjs
node tests/whatif_frontend.test.cjs
```

Tests use isolated storage and mock provider calls. Synthetic PDF fixtures are clearly labelled and must never be treated as real university policies.

## Reliability and evaluation status

This is **not a production-ready or independently accuracy-validated policy service**. Human adjudication and evaluation on previously unseen documents remain pending. Revealed development cases are not untouched benchmarks. Some relevant answers can still be rejected by the second model call; strict withholding is preserved. No HyDE-superiority claim is established.

Public documentation retains historical findings and their corrections. Full private runtime artifacts, source PDFs, screenshots, repeated backups and most raw diagnostic records are excluded. One minimal sanitized archived-context fixture is retained for the existing regression test. Local-path references and links to omitted artifacts in historical reports are not portable runnable instructions; use this README for setup.

- [Architecture](ARCHITECTURE.md)
- [Personal workspace and API](docs/PERSONAL_PLATFORM.md)
- [Latest reliability refinements](docs/RELIABILITY_REFINEMENTS.md)
- [Human-review packet](evaluation/ps1/refinements/review-packet/REVIEW.md)
- [Frozen-comparison protocol](evaluation/ps1/refinements/FROZEN_COMPARISON_PROTOCOL.md)
- [Prompt history](PROMPTS.md)
- [Engineering decisions](DECISIONS.md)
- [Publication scope](docs/REPOSITORY_PUBLICATION.md)

## Render deployment

See [Render deployment](docs/RENDER_DEPLOYMENT.md). The default Blueprint is a free, temporary demo. Uploaded files, workspace records and indexes are not durable. Deployment requires connecting your Render account and configuring secrets privately.
