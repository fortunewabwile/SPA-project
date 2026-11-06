# Wordly Dictionary

A single page application (SPA) that lets users search for a word and instantly see its pronunciation, definitions, examples, synonyms and source, all without reloading the page. Built with HTML, CSS and vanilla JavaScript for the Summative Lab: Single Page Application (SPA) – Wordly.

## Features

- **Search for words:** an HTML form fetches data from the [Free Dictionary API](https://dictionaryapi.dev/).
- **Dynamic results:** shows the word, phonetic spelling, part of speech, definitions, example usage, synonyms and source link, updated on the same page.
- **Audio playback:** a "Play audio" button for pronunciation when the API provides audio.
- **Clickable synonyms:** click a synonym to look it up immediately.
- **Save words:** save favorite words; they are highlighted and kept between visits using `localStorage`.
- **Light and dark themes:** JavaScript switches the CSS theme and remembers the choice.
- **Error handling:** clear messages for empty input, invalid input, words not found, and API or network failures.
- **Graceful fallbacks:** friendly messages when a word has no synonyms or pronunciation.
- **Accessibility:** semantic HTML, `aria-label` attributes, an `aria-live` results region, keyboard focus styles and reduced-motion support.

## Project Structure

```
wordly/
├── index.html   # Page structure (form, results, saved words)
├── style.css    # Layout, themes, hover effects and animations
├── script.js    # Fetching, parsing, DOM updates and event listeners
└── README.md
```

## How to Run

1. Clone or download this repository.
2. Open the folder in VS Code.
3. Start it with the **Live Server** extension (right-click `index.html` → *Open with Live Server*), or open `index.html` directly in a browser.
4. An internet connection is required to reach the dictionary API.

## How It Works

1. The user types a word and submits the form.
2. A `submit` event listener prevents the page reload and validates the input.
3. `fetch()` requests `https://api.dictionaryapi.dev/api/v2/entries/en/<word>`.
4. The JSON response is parsed to extract the pronunciation, meanings, definitions, examples, synonyms and source.
5. The DOM is updated dynamically with the results.
6. Errors (not found, network failure, bad input) show a message instead.

## Testing

| Test | Example | Expected result |
|------|---------|-----------------|
| Valid word | `happy` | Definitions, pronunciation and synonyms display correctly |
| Word with little data | `the` | Fallback messages for missing synonyms or audio |
| Word not found | `asdfgh` | "No definitions found" error message |
| Empty search | (blank) | "Please enter a word to search." |
| Invalid input | `abc123` | "Please use letters only" message |
| API failure | Offline or API down | Retries, then shows a friendly error message |
| Save a word | Click "Save word" | Button highlights and word appears in the saved list |
| Theme toggle | Click "Dark mode" | Theme switches and persists after refresh |

## Known Issues and Fixes

- **Intermittent API failures:** the free API sometimes returns `502 Bad Gateway`. The browser reports this as a CORS or network error. `fetchWord()` retries up to 3 times, waiting 1 second between attempts, before showing an error.

## Maintenance

- **Version control:** changes are tracked with Git and GitHub, which supports collaboration and reverting to earlier versions.
- **Regular reviews:** periodically check that the API still works and that the code follows current JavaScript practices.
- **Documentation:** this repository holds the lab documents, example code and solutions.

## Technologies

- HTML5
- CSS3 (custom properties, flexbox, animations)
- JavaScript (ES6+: `fetch`, `async/await`, DOM manipulation, `localStorage`)

## Credits

- Dictionary data from the [Free Dictionary API](https://dictionaryapi.dev/).