# Financial News Summarizer

Summarizes financial news articles using:
- Extractive summarization (spaCy + PyTextRank when available)
- Abstractive summarization (BART)

## Setup

### 1) Install dependencies
`pip install -r requirements.txt`

### 2) Install the spaCy model
This project uses `en_core_web_sm`. In some environments, `python -m spacy download ...` can fail, so install the model with pip instead:

`python -m pip install -U en-core-web-sm==3.7.1`

Quick check:
`python -c "import spacy; spacy.load('en_core_web_sm'); print('spaCy model OK')"`

### 3) Run the backend
`cd backend`
`python app.py`

### 4) Open the frontend
Open `frontend/index.html` in your browser.

## Project structure
- `frontend/` HTML/CSS/JS UI
- `backend/` Flask API + summarizers
- `data/` Sample articles
- `outputs/` Saved summaries

## Author
OMPRAKASH S