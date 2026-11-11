# Language Translation Tool

A compact, single-screen browser translation website for CodeAlpha Day 2, Task 1. Its layout follows the supplied translator reference while keeping Lingua's teal visual identity. It includes text translation, 17 language choices, voice input/output where supported, copy and share actions, saved translations, feedback, history, and a contribution contact link.

## Run locally

Run `python -m http.server 4173` in this folder, then open `http://localhost:4173`.

## API and privacy

The website sends the entered text and selected language pair to MyMemory for translation. Avoid entering sensitive text. Anonymous use is limited to 5,000 characters per day, with a 500-byte maximum per source request. No API key is stored in the website.
