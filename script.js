/* Wordly – application logic (loaded from index.html) */
/* =====================================================
   JAVASCRIPT
   Sections: 1) setup  2) fetch  3) render  4) save list
             5) theme  6) event listeners
   ===================================================== */

/* ---------- 1. SETUP: grab elements & app state ---------- */
const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const results = document.getElementById("results");
const savedSection = document.getElementById("saved-section");
const savedList = document.getElementById("saved-list");
const themeToggle = document.getElementById("theme-toggle");

let currentWord = null;                              // word currently displayed
let savedWords = loadFromStorage("wordly-saved", []); // array of saved words

/* Read JSON from localStorage safely (returns fallback on any problem) */
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

/* ---------- 2. FETCH DATA FROM THE API ---------- */
/* Returns the first dictionary entry, or throws an Error with a
   user-friendly message (word not found / network failure). */
async function fetchWord(word) {
  /* Try up to 3 times, waiting 1 second between attempts.
   The free API sometimes returns 502 errors (which the browser
   reports as a CORS/network failure), so retrying hides this. */
const MAX_ATTEMPTS = 3;
let response;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    response = await fetch(API_URL + encodeURIComponent(word));
    break; // success, stop retrying
  } catch (networkError) {
    if (attempt === MAX_ATTEMPTS) {
      throw new Error("The dictionary service is temporarily unavailable. Please try again in a moment.");
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s, then retry
  }
}
  const data = await response.json();   // API returns an array of entries
  return data[0];
}

/* ---------- 3. PARSE & DISPLAY (DOM updates) ---------- */

/* Small helper: create an element with optional class and text.
   Using textContent (not innerHTML) keeps API data from injecting HTML. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* Show a message (info or error) in the results section */
function showMessage(text, isError = false) {
  results.replaceChildren(el("div", "message" + (isError ? " error" : ""), text));
}

/* Pull the useful pronunciation data out of the API response */
function getPronunciation(entry) {
  const list = entry.phonetics || [];
  const text = entry.phonetic || (list.find(p => p.text) || {}).text || "";
  const audio = (list.find(p => p.audio) || {}).audio || "";
  return { text, audio };
}

/* Build the full result card from one API entry */
function renderEntry(entry) {
  currentWord = entry.word;
  const card = el("article", "card");

  // --- Word title + save button ---
  card.appendChild(el("h2", "word-title", entry.word));

  const actions = el("div", "actions");

  // --- Pronunciation text + audio playback (with fallbacks) ---
  const pron = getPronunciation(entry);
  actions.appendChild(el("span", "phonetic", pron.text || "Pronunciation not available"));

  if (pron.audio) {
    const audioBtn = el("button", "ghost", "Play audio");
    audioBtn.setAttribute("aria-label", `Play pronunciation of ${entry.word}`);
    audioBtn.addEventListener("click", () => new Audio(pron.audio).play());
    actions.appendChild(audioBtn);
  }

  const saveBtn = el("button", "ghost", "");
  saveBtn.id = "save-btn";
  saveBtn.addEventListener("click", toggleSaved);
  actions.appendChild(saveBtn);
  card.appendChild(actions);

  // --- Each meaning: part of speech, definitions, example, synonyms ---
  const allSynonyms = new Set();
  (entry.meanings || []).forEach(meaning => {
    card.appendChild(el("p", "pos", meaning.partOfSpeech));

    const ol = el("ol");
    meaning.definitions.slice(0, 3).forEach(def => {   // limit to 3 per part of speech
      const li = el("li", "", def.definition);
      if (def.example) li.appendChild(el("p", "example", `"${def.example}"`));
      ol.appendChild(li);
      (def.synonyms || []).forEach(s => allSynonyms.add(s));
    });
    card.appendChild(ol);
    (meaning.synonyms || []).forEach(s => allSynonyms.add(s));
  });

  // --- Synonyms (clickable chips) or fallback message ---
  card.appendChild(el("p", "pos", "Synonyms"));
  if (allSynonyms.size) {
    const wrap = el("div", "synonyms");
    [...allSynonyms].slice(0, 12).forEach(s => {
      const chip = el("button", "chip", s);
      chip.addEventListener("click", () => search(s)); // click a synonym to look it up
      wrap.appendChild(chip);
    });
    card.appendChild(wrap);
  } else {
    card.appendChild(el("p", "example", "No synonyms available for this word."));
  }

  // --- Source details ---
  const sources = entry.sourceUrls || [];
  if (sources.length) {
    const p = el("p", "source");
    p.appendChild(el("span", "", "Source: "));
    const a = el("a", "", sources[0]);
    a.href = sources[0];
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    p.appendChild(a);
    card.appendChild(p);
  }

  results.replaceChildren(card);
  updateSaveButton();
}

/* ---------- 4. SAVED WORDS (dynamic CSS updates) ---------- */

/* Add or remove the current word from the saved list */
function toggleSaved() {
  if (!currentWord) return;
  const word = currentWord.toLowerCase();
  savedWords = savedWords.includes(word)
    ? savedWords.filter(w => w !== word)   // remove
    : [...savedWords, word];               // add
  try { localStorage.setItem("wordly-saved", JSON.stringify(savedWords)); } catch (e) {}
  updateSaveButton();
  renderSavedList();
}

/* Update the save button text and add/remove the highlight class */
function updateSaveButton() {
  const btn = document.getElementById("save-btn");
  if (!btn || !currentWord) return;
  const saved = savedWords.includes(currentWord.toLowerCase());
  btn.textContent = saved ? "Saved" : "Save word";
  btn.classList.toggle("is-saved", saved);      // JS controls the CSS highlight
  btn.setAttribute("aria-pressed", String(saved));
}

/* Rebuild the saved-words list; clicking a word searches it again */
function renderSavedList() {
  savedList.replaceChildren();
  savedSection.classList.toggle("hidden", savedWords.length === 0);
  savedWords.forEach(word => {
    const li = document.createElement("li");
    const btn = el("button", "chip is-saved", word);
    btn.addEventListener("click", () => search(word));
    li.appendChild(btn);
    savedList.appendChild(li);
  });
}

/* ---------- 5. THEME SWITCHING ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  try { localStorage.setItem("wordly-theme", theme); } catch (e) {}
}

/* ---------- 6. MAIN SEARCH FLOW + EVENT LISTENERS ---------- */

/* Validate input, fetch, then render (or show an error) */
async function search(rawWord) {
  const word = rawWord.trim();

  // Empty input
  if (!word) {
    showMessage("Please enter a word to search.", true);
    return;
  }
  // Invalid input: letters, apostrophes and hyphens only
  if (!/^[A-Za-z'-]+$/.test(word)) {
    showMessage("Please use letters only (no numbers, spaces or symbols).", true);
    return;
  }

  input.value = word;
  showMessage("Searching…");          // loading state

  try {
    const entry = await fetchWord(word);
    renderEntry(entry);
  } catch (error) {
    showMessage(error.message, true); // not found / API failure
  }
}

/* Form submit: stop the page reload (that's what makes it a SPA) */
form.addEventListener("submit", event => {
  event.preventDefault();
  search(input.value);
});

/* Theme button */
themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
});

/* On load: restore saved theme and saved words */
applyTheme(loadFromStorage("wordly-theme", "light"));
renderSavedList();