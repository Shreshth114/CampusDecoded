# CampusDecoded hosted smoke check

Synthetic test only; no university-policy accuracy claim. Credentials, capability IDs and document IDs are omitted.

```json
{
  "homepage": {
    "status": 200,
    "brand_present": true
  },
  "health": {
    "status": 200,
    "storage_mode": "ephemeral",
    "groq_configured": true
  },
  "admin_auth": 200,
  "upload": {
    "status": 200,
    "has_error": false
  },
  "index": {
    "status": "ok",
    "elapsed_s": 10.5,
    "errors": 0
  },
  "chunks": {
    "status": 200,
    "total": 1
  },
  "answer": {
    "decision": "answered",
    "reason": null,
    "citations_verified": true,
    "mentions_fixture_value": true,
    "provider": "groq"
  },
  "cleanup": 200
}
```
