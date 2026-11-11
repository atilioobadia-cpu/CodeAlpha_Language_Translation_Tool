# Language Translation Tool

A compact browser-based translation website for CodeAlpha Day 2, Task 1. The centered layout keeps Lingua's teal palette and presents language selection above a balanced pair of translation panels. Translate, History, Saved, and Contribute views share a smooth page transition.

Features include 17 language choices, text translation through MyMemory, voice input/output where supported, copy and share actions, saved translations, feedback, and session history.

## Run locally

Run `python -m http.server 4173` in this folder, then open `http://localhost:4173`.

## API and privacy

The website sends the entered text and selected language pair to MyMemory for translation. Avoid entering sensitive text. Anonymous use is limited to 5,000 characters per day, with a 500-byte maximum per source request. No API key is stored in the website.
