from flask import Flask, request, jsonify
from flask_cors import CORS
from extractive_summarizer import extractive_summary
from abstractive_summarizer import abstractive_summary
from evaluate import get_rouge_scores

app = Flask(__name__)
CORS(app)  # Allow frontend to call this backend

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Financial News Summarizer API is running."})

@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.get_json()

    if not data or "article" not in data:
        return jsonify({"error": "No article provided."}), 400

    article = data["article"].strip()

    if len(article.split()) < 30:
        return jsonify({"error": "Article is too short. Please provide a longer text."}), 400

    # Generate summaries
    ext_summary = extractive_summary(article, num_sentences=3)
    abs_summary = abstractive_summary(article)

    # Evaluate: compare abstractive summary against extractive (as reference)
    rouge = get_rouge_scores(reference=ext_summary, hypothesis=abs_summary)

    # Save output to file
    with open("../outputs/summaries.txt", "a", encoding="utf-8") as f:
        f.write("=== NEW SUMMARY ===\n")
        f.write(f"EXTRACTIVE:\n{ext_summary}\n\n")
        f.write(f"ABSTRACTIVE:\n{abs_summary}\n\n")
        f.write(f"ROUGE SCORES: {rouge}\n")
        f.write("=" * 40 + "\n\n")

    return jsonify({
        "extractive_summary": ext_summary,
        "abstractive_summary": abs_summary,
        "rouge_scores": rouge
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
