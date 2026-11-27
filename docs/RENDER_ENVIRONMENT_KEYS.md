# Render environment credential update — 27 November 2026

User requested transferring all credentials from the existing local .env to the confirmed CampusDecoded Render service.

Updated privately, with merge semantics (not replacement):

- GROQ_API_KEY
- GEMINI_API_KEY
- ADMIN_API_TOKEN
- GROQ_MODEL
- GEMINI_MODEL

No credential values were displayed, committed or recorded in this report. Runtime paths, resource plan, port, concurrency limits and primary-provider choice were preserved. No key rotation or arbitrary new credential generation was performed. The provider model settings accompany their corresponding API credentials.

Render automatically started a configuration redeploy, which is now live. The deployed `/health` endpoint returned HTTP 200 with both `groq.configured` and `gemini.configured` true. Configured means the key and model settings exist; it is not proof of provider quota, billing, model availability or successful Gemini inference. No extra model call was made for this settings update.

Application code, source documents and local indexes were not modified. This documentation-only commit uses `[skip render]` to avoid another service restart.
