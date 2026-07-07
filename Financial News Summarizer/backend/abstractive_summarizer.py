from transformers import pipeline

_summarizer = None


def _get_summarizer():
    global _summarizer
    if _summarizer is not None:
        return _summarizer
    try:
        _summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    except Exception as e:
        raise RuntimeError(
            "Failed to load the Hugging Face summarization pipeline. "
            "If you're offline, download/cache the model first (facebook/bart-large-cnn)."
        ) from e
    return _summarizer

def abstractive_summary(text, max_len=150, min_len=40):
    # BART has a token limit, so trim input if too long
    if len(text.split()) > 900:
        text = " ".join(text.split()[:900])

    summarizer = _get_summarizer()
    result = summarizer(text, max_length=max_len, min_length=min_len, do_sample=False)
    return result[0]['summary_text']
