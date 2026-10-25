const API = "/.netlify/functions/reviews";

const form = document.getElementById("review-form");
const starsEl = document.getElementById("stars");
const ratingInput = document.getElementById("rating");
const commentEl = document.getElementById("comment");
const charCount = document.getElementById("char-count");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("review-list");
const avgEl = document.getElementById("avg-rating");
const totalEl = document.getElementById("total-reviews");

function paintStars(value) {
  document.querySelectorAll(".star").forEach((s) => {
    const v = Number(s.dataset.value);
    s.classList.toggle("active", v <= value);
    s.setAttribute("aria-checked", v === value ? "true" : "false");
  });
}

starsEl.addEventListener("click", (e) => {
  const star = e.target.closest(".star");
  if (!star) return;
  const value = Number(star.dataset.value);
  ratingInput.value = value;
  paintStars(value);
});

starsEl.addEventListener("keydown", (e) => {
  const star = e.target.closest(".star");
  if (!star) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    star.click();
  }
});

paintStars(5);

commentEl.addEventListener("input", () => {
  charCount.textContent = commentEl.value.length;
});

function setStatus(msg, type = "") {
  statusEl.textContent = msg;
  statusEl.className = "status " + type;
}

function renderReviews(reviews) {
  if (!reviews.length) {
    listEl.innerHTML = '<p class="empty">Nessuna recensione ancora. Sii il primo!</p>';
    avgEl.textContent = "—";
    totalEl.textContent = "0 recensioni";
    return;
  }

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  avgEl.textContent = `★ ${avg.toFixed(1)}`;
  totalEl.textContent = `${reviews.length} recension${reviews.length === 1 ? "e" : "i"}`;

  listEl.innerHTML = reviews.map((r) => {
      const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
      const date = new Date(r.timestamp).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
      return `
        <div class="review">
          <div class="review-head">
            <span class="review-name">${escapeHtml(r.name || "Anonimo")}</span>
            <span class="review-stars" title="${r.rating}/5">${stars}</span>
          </div>
          <div class="review-comment">${escapeHtml(r.comment || "")}</div>
          <div class="review-date">${date}</div>
        </div>
      `;
    }).join("");
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

async function loadReviews() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error("Errore nel caricamento");
    const data = await res.json();
    renderReviews(data);
  } catch (err) {
    listEl.innerHTML = '<p class="empty">Impossibile caricare le recensioni.</p>';
    console.error(err);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const rating = Number(ratingInput.value);
  const comment = commentEl.value.trim();

  if (!comment) { setStatus("Scrivi una recensione prima di inviare.", "err"); return; }
  if (rating < 1 || rating > 5) { setStatus("Seleziona una valutazione da 1 a 5 stelle.", "err"); return; }

  submitBtn.disabled = true;
  setStatus("Invio in corso…");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rating, comment }),
    });
    if (!res.ok) throw new Error("Invio fallito");

    setStatus("Recensione pubblicata! ✨", "ok");
    form.reset();
    paintStars(5);
    ratingInput.value = 5;
    charCount.textContent = "0";
    await loadReviews();
  } catch (err) {
    setStatus("Errore durante l'invio. Riprova.", "err");
    console.error(err);
  } finally {
    submitBtn.disabled = false;
  }
});

loadReviews();