import contextlib
import io
import os
from typing import Optional

import spacy

# PyTextRank depends on GitPython, which by default can raise at import-time if
# `git.exe` isn't available on PATH. This keeps the backend runnable in
# environments without git installed.
os.environ.setdefault("GIT_PYTHON_REFRESH", "quiet")

try:
    # pytextrank prints to stdout on import in some versions; keep backend output clean.
    with contextlib.redirect_stdout(io.StringIO()):
        import pytextrank  # type: ignore
except Exception:
    pytextrank = None

_NLP: Optional["spacy.language.Language"] = None


def _get_nlp() -> "spacy.language.Language":
    global _NLP
    if _NLP is not None:
        return _NLP

    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception:
        # Fallback that doesn't require downloading a model.
        nlp = spacy.blank("en")
        if "sentencizer" not in nlp.pipe_names:
            nlp.add_pipe("sentencizer")

    if pytextrank is not None and "textrank" not in nlp.pipe_names:
        nlp.add_pipe("textrank")

    _NLP = nlp
    return nlp


def extractive_summary(text: str, num_sentences: int = 3) -> str:
    nlp = _get_nlp()
    doc = nlp(text)

    # Preferred: TextRank (when available).
    if pytextrank is not None and hasattr(doc._, "textrank"):
        summary_sentences = [str(s) for s in doc._.textrank.summary(limit_sentences=num_sentences)]
        return " ".join(summary_sentences)

    # Fallback: first N sentences.
    sents = [str(s).strip() for s in doc.sents if str(s).strip()]
    return " ".join(sents[: max(1, num_sentences)])
