const API_URL = "http://localhost:5000/summarize";

const SAMPLE_ARTICLE = `Markets rose on Thursday after fresh inflation data came in below expectations, easing fears of additional rate hikes. The S&P 500 gained 1.2% while the Nasdaq climbed 1.6%, led by technology and consumer discretionary stocks. Analysts said investors are rotating back into growth names as bond yields retreat, though they cautioned that earnings guidance will remain the key driver through the rest of the quarter.`;

function el(id) {
  return document.getElementById(id);
}

let toastTimer = null;

function showToast(message) {
  const toast = el("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2600);
}

function setFormError(message) {
  const formError = el("formError");
  if (!formError) return;

  if (!message) {
    formError.textContent = "";
    formError.classList.add("hidden");
    return;
  }

  formError.textContent = message;
  formError.classList.remove("hidden");
}

function setBusy(isBusy) {
  const loading = el("loading");
  const summarizeBtn = el("summarizeBtn");
  const sampleBtn = el("sampleBtn");
  const clearBtn = el("clearBtn");

  if (loading) loading.classList.toggle("hidden", !isBusy);

  if (summarizeBtn) summarizeBtn.disabled = isBusy;
  if (sampleBtn) sampleBtn.disabled = isBusy;
  if (clearBtn) clearBtn.disabled = isBusy;
}

function setResultsVisible(visible) {
  const results = el("results");
  const emptyState = el("emptyState");

  if (results) results.classList.toggle("hidden", !visible);
  if (emptyState) emptyState.classList.toggle("hidden", visible);
}

function updateCharCount() {
  const articleInput = el("articleInput");
  const charCount = el("charCount");
  if (!articleInput || !charCount) return;

  const count = articleInput.value.length;
  charCount.textContent = `${count.toLocaleString()} character${count === 1 ? "" : "s"}`;
}

async function runSummarize() {
  const articleInput = el("articleInput");
  const extractiveOutput = el("extractiveOutput");
  const abstractiveOutput = el("abstractiveOutput");
  const rougeOutput = el("rougeOutput");

  if (!articleInput || !extractiveOutput || !abstractiveOutput || !rougeOutput) {
    return;
  }

  const article = articleInput.value.trim();
  if (!article) {
    setFormError("Paste an article first.");
    showToast("Nothing to summarize.");
    articleInput.focus();
    return;
  }

  setFormError("");
  setBusy(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article }),
    });

    if (!response.ok) {
      let details = "";
      try {
        const maybeJson = await response.json();
        details = typeof maybeJson?.error === "string" ? ` (${maybeJson.error})` : "";
      } catch {
        // ignore JSON parse failures
      }
      throw new Error(`Server error${details}.`);
    }

    const data = await response.json();

    extractiveOutput.textContent = data.extractive_summary ?? "";
    abstractiveOutput.textContent = data.abstractive_summary ?? "";

    const r = data.rouge_scores ?? {};
    rougeOutput.textContent =
      `ROUGE-1 : ${r.rouge1 ?? "—"}\n` +
      `ROUGE-2 : ${r.rouge2 ?? "—"}\n` +
      `ROUGE-L : ${r.rougeL ?? "—"}`;

    setResultsVisible(true);
    showToast("Summary generated.");
  } catch (error) {
    setFormError(error?.message ? String(error.message) : "Unexpected error.");
    showToast("Failed to summarize.");
  } finally {
    setBusy(false);
  }
}

function initTheme() {
  const toggle = el("themeToggle");
  if (!toggle) return;

  const storageKey = "fns_theme";

  function apply(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      toggle.textContent = "Light";
    } else {
      document.documentElement.removeAttribute("data-theme");
      toggle.textContent = "Dark";
    }
  }

  const saved = localStorage.getItem(storageKey);
  apply(saved === "dark" ? "dark" : "light");

  toggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    localStorage.setItem(storageKey, next);
    apply(next);
  });
}

function init() {
  const form = el("summarizeForm");
  const articleInput = el("articleInput");
  const clearBtn = el("clearBtn");
  const sampleBtn = el("sampleBtn");

  initTheme();
  updateCharCount();
  setResultsVisible(false);

  if (articleInput) {
    articleInput.addEventListener("input", () => {
      if (el("formError") && !el("formError").classList.contains("hidden")) setFormError("");
      updateCharCount();
    });

    articleInput.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runSummarize();
      }
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      runSummarize();
    });
  }

  if (clearBtn && articleInput) {
    clearBtn.addEventListener("click", () => {
      articleInput.value = "";
      updateCharCount();
      setFormError("");
      setResultsVisible(false);
      showToast("Cleared.");
      articleInput.focus();
    });
  }

  if (sampleBtn && articleInput) {
    sampleBtn.addEventListener("click", () => {
      articleInput.value = SAMPLE_ARTICLE;
      updateCharCount();
      setFormError("");
      setResultsVisible(false);
      showToast("Sample loaded.");
      articleInput.focus();
    });
  }
}

document.addEventListener("DOMContentLoaded", init);

// Backwards compatibility for any existing inline calls.
async function summarize() {
  await runSummarize();
}
