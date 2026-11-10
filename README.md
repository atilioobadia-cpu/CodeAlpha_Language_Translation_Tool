# Language Translation Tool

A simple mobile-first translation app for CodeAlpha Day 2, Task 1. Choose a source and target language, enter text, and translate it through the MyMemory API. The page also includes language swapping, copy, and text-to-speech controls.

## Files
- `index.html` — app interface and styling
- `app.js` — language selection, validation, MyMemory request, copy and speech actions

## Run locally

The browser app uses `fetch` to call MyMemory. Run it from a local web server rather than opening the HTML file directly:

```powershell
cd "F:\Code_Alpha_Projects\Day 02 - Artificial Intelligence\Language Translation Tool"
python -m http.server 4173
```

Then open `http://localhost:4173`.

## API and privacy

The app sends entered text and the selected language pair to MyMemory's translation endpoint. Do not submit sensitive text. Anonymous use is limited to 5,000 characters per day, and each source entry is limited to 500 bytes per request. No API key is stored in the app.

- API: https://api.mymemory.translated.net/get
- API specification: https://mymemory.translated.net/doc/spec.php
- Usage limits: https://mymemory.translated.net/doc/usagelimits.php