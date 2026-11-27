"""Cache the configured public embedding model at build time; no documents/LLM calls."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from src.embeddings import _get_model

if __name__=='__main__':
    _get_model()
