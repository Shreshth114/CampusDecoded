"""
config.py — Loads all configuration from .env with sensible defaults.

Every tunable parameter lives here. No magic strings elsewhere.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_PROJECT_ROOT / ".env")

# ── LLM Providers ──────────────────────────────────────────────
LLM_PRIMARY = os.getenv("LLM_PRIMARY", "groq")
LLM_FALLBACK = os.getenv("LLM_FALLBACK", "gemini")
LLM_MAX_CONCURRENCY = int(os.getenv("LLM_MAX_CONCURRENCY", "2"))
LLM_TOTAL_WAIT_BUDGET = float(os.getenv("LLM_TOTAL_WAIT_BUDGET", "35.0"))
ANSWER_CHUNKS_LIMIT = int(os.getenv("ANSWER_CHUNKS_LIMIT", "3"))
DEFAULT_RETRIEVAL_MODE = os.getenv("DEFAULT_RETRIEVAL_MODE", "fusion")

# Provider registry: maps provider name → config
PROVIDERS = {
    "groq": {
        "api_key": os.getenv("GROQ_API_KEY", ""),
        "model": os.getenv("GROQ_MODEL", ""),
        "base_url": os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
    },
    "gemini": {
        "api_key": os.getenv("GEMINI_API_KEY", ""),
        "model": os.getenv("GEMINI_MODEL", ""),
    },
}

# ── Embeddings ─────────────────────────────────────────────────
EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-small-en-v1.5")
EMBED_BATCH_SIZE = int(os.getenv("EMBED_BATCH_SIZE", "8"))

# ── Vector DB ──────────────────────────────────────────────────
CHROMA_DIR = os.getenv("CHROMA_DIR", str(_PROJECT_ROOT / ".chroma"))

# ── Retrieval ──────────────────────────────────────────────────
TOP_K = int(os.getenv("TOP_K", "5"))
# similarity = 1 - cosine_distance; gate fires when best_similarity < threshold
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.35"))

# ── Cache ──────────────────────────────────────────────────────
CACHE_THRESHOLD = float(os.getenv("CACHE_THRESHOLD", "0.95"))
CACHE_SEMANTIC_ENABLED = os.getenv("CACHE_SEMANTIC_ENABLED", "false").lower() == "true"

# ── Generation ─────────────────────────────────────────────────
HYDE_MAX_TOKENS = int(os.getenv("HYDE_MAX_TOKENS", "200"))
ANSWER_MAX_TOKENS = int(os.getenv("ANSWER_MAX_TOKENS", "350"))

# ── Chunking ───────────────────────────────────────────────────
CHUNK_MAX_TOKENS = int(os.getenv("CHUNK_MAX_TOKENS", "350"))
CHUNK_OVERLAP_FRACTION = float(os.getenv("CHUNK_OVERLAP_FRACTION", "0.12"))

# ── Paths ──────────────────────────────────────────────────────
DATA_ROOT = Path(os.getenv("CAMPUS_DATA_DIR", str(_PROJECT_ROOT / "data"))).expanduser().resolve()
STORAGE_MODE = os.getenv("CAMPUS_STORAGE_MODE", "local")
DATA_RAW_DIR = DATA_ROOT / "raw"
DATA_DECOYS_DIR = _PROJECT_ROOT / "data" / "decoys"
DATA_PROCESSED_DIR = DATA_ROOT / "processed"
MANIFEST_PATH = _PROJECT_ROOT / "data" / "processed" / "manifest.json"
CACHE_PATH = _PROJECT_ROOT / "data" / "processed" / "cache.json"

# ── Server ─────────────────────────────────────────────────────
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))

# ── Derived ────────────────────────────────────────────────────
PROJECT_ROOT = _PROJECT_ROOT


# Reject invalid tunables instead of silently disabling confidence/size guards.
import math
if TOP_K < 1 or not math.isfinite(CONFIDENCE_THRESHOLD) or not 0 <= CONFIDENCE_THRESHOLD <= 1:
    raise ValueError("TOP_K must be positive and CONFIDENCE_THRESHOLD in [0, 1]")
if not math.isfinite(CACHE_THRESHOLD) or not 0.95 <= CACHE_THRESHOLD <= 1:
    raise ValueError("CACHE_THRESHOLD must be in [0.95, 1]")
if CHUNK_MAX_TOKENS < 1 or not 0 <= CHUNK_OVERLAP_FRACTION < 1:
    raise ValueError("Invalid chunk limits or overlap")
if min(HYDE_MAX_TOKENS, ANSWER_MAX_TOKENS) < 1:
    raise ValueError("Generation token limits must be positive")
if EMBED_BATCH_SIZE < 1:
    raise ValueError("EMBED_BATCH_SIZE must be positive")
if LLM_PRIMARY not in PROVIDERS or LLM_FALLBACK not in PROVIDERS:
    raise ValueError("LLM_PRIMARY and LLM_FALLBACK must name configured provider types")
if LLM_MAX_CONCURRENCY < 1:
    raise ValueError("LLM_MAX_CONCURRENCY must be positive")
if LLM_TOTAL_WAIT_BUDGET < 5.0:
    raise ValueError("LLM_TOTAL_WAIT_BUDGET must be at least 5.0 seconds")
if ANSWER_CHUNKS_LIMIT < 1:
    raise ValueError("ANSWER_CHUNKS_LIMIT must be positive")
if DEFAULT_RETRIEVAL_MODE not in {"raw", "hyde", "fusion"}:
    raise ValueError("DEFAULT_RETRIEVAL_MODE must be raw, hyde, or fusion")
