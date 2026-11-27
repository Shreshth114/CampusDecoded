"""
embeddings.py — Local embedding wrapper using fastembed.

Wraps BAAI/bge-small-en-v1.5 (384-dim, CPU). Singleton model
to avoid reloading on every call.
"""

from __future__ import annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from fastembed import TextEmbedding
from threading import RLock
import time
import os

_MODEL_LOCK = RLock()
from src.config import EMBED_MODEL, EMBED_BATCH_SIZE

_model: TextEmbedding | None = None


def _get_model() -> TextEmbedding:
    """Lazy-load the embedding model (downloads on first use, ~100MB)."""
    global _model
    from fastembed import TextEmbedding
    if _model is None:
        started = time.perf_counter()
        print(f"[embeddings] Loading {EMBED_MODEL}...", flush=True)
        _model = TextEmbedding(model_name=EMBED_MODEL, cache_dir=os.getenv("FASTEMBED_CACHE_PATH"))
        print(f"[embeddings] Model loaded in {time.perf_counter() - started:.2f}s; "
              f"inference batch size={EMBED_BATCH_SIZE}.", flush=True)
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of texts. Returns list of float vectors.

    Bound each ONNX inference batch, preserve input order, and report progress.
    """
    if not texts:
        return []
    if EMBED_BATCH_SIZE < 1:
        raise ValueError("EMBED_BATCH_SIZE must be positive")
    with _MODEL_LOCK:
        model = _get_model()
        total = len(texts)
        started = time.perf_counter()
        embeddings = []
        if total > 1:
            print(f"[embeddings] Starting {total} chunks in batches of {EMBED_BATCH_SIZE}; "
                  "no parallel model workers.", flush=True)
        # Keep FastEmbed's tokenizer, weights, precision and session settings intact.
        for index, vector in enumerate(model.embed(
            texts, batch_size=EMBED_BATCH_SIZE, parallel=None,
        ), 1):
            embeddings.append(vector.tolist())
            if total > 1 and (index % EMBED_BATCH_SIZE == 0 or index == total):
                elapsed = time.perf_counter() - started
                print(f"[embeddings] {index}/{total} chunks; {elapsed:.2f}s elapsed; "
                      f"{index / max(elapsed, 1e-9):.2f} chunks/s", flush=True)
        if len(embeddings) != total:
            raise ValueError(f"Embedding count mismatch: expected {total}, got {len(embeddings)}")
    return embeddings


def embed_single(text: str) -> list[float]:
    """Embed a single text string. Convenience wrapper."""
    return embed_texts([text])[0]

