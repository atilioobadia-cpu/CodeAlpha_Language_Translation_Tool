# Lingua

Lingua is a clean, browser-based translation tool for translating short text between 17 languages. It combines a searchable language picker with a focused side-by-side translation workspace, translation history, and saved phrases.

## Features

- Translate text between 17 languages, including English, Swahili, French, Spanish, Arabic, Hindi, Chinese, Japanese, and more.
- Search and select source and target languages, then swap them with one action.
- Review recent translations in History and save useful results for later.
- Copy, share, or listen to translations with browser-supported speech tools.
- Dictate source text where browser speech recognition is available.
- Navigate between Translate, History, and Saved with animated page transitions.
- Use the responsive interface on desktop and mobile screens.

## Getting started

Lingua is a static website and does not require a build step or package installation. It requires a modern browser and an internet connection for translations.

1. Clone the repository and open its folder.
2. Start a local web server from the project directory:

   ```bash
   python -m http.server 4173
   ```

3. Open [http://localhost:4173](http://localhost:4173) in your browser.

You can also serve the files with any static HTTP server. Opening `index.html` directly may prevent some browser features from working as expected.

## How translation works

Lingua sends the entered text and selected language codes to the [MyMemory Translation API](https://mymemory.translated.net/doc/spec.php). Translation requests are limited to 500 bytes of source text. Anonymous API use is subject to MyMemory's daily quota and terms.

Translations are processed by a third-party service. Do not enter confidential or sensitive information. History is held for the current page session; saved translations are stored in the browser's local storage on that device.

Speech input and playback depend on the browser's Web Speech API support and available system voices.

## Project structure

```text
.
├── index.html          # Application structure
├── styles.css          # Responsive layout and visual styles
├── app.js              # Language selection, translation, history, and saved items
└── vendor/
    ├── lucide.min.js   # Locally bundled Lucide icons
    └── LUCIDE-LICENSE  # Icon library license
```

## Technologies

- HTML
- CSS
- Vanilla JavaScript
- MyMemory Translation API
- Lucide icons

## Acknowledgements

Icons are provided by [Lucide](https://lucide.dev/), an open-source icon library. Translation requests are provided by [MyMemory](https://mymemory.translated.net/).
