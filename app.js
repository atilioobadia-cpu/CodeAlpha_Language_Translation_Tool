const API_ENDPOINT = 'https://api.mymemory.translated.net/get';
const MAX_BYTES = 500;
const MAX_HISTORY = 12;
const numberFormat = new Intl.NumberFormat();
let requestSequence = 0;
let historyItems = [];
let translatedValue = '';
let requestController;
let savedItems = [];
try { savedItems = JSON.parse(localStorage.getItem('linguaSaved') || '[]'); } catch { savedItems = []; }

const languages = [
  { code: 'en', name: 'English' }, { code: 'sw', name: 'Swahili' }, { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' }, { code: 'ar', name: 'Arabic' }, { code: 'pt', name: 'Portuguese' },
  { code: 'de', name: 'German' }, { code: 'it', name: 'Italian' }, { code: 'hi', name: 'Hindi' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' }, { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
  { code: 'nl', name: 'Dutch' }, { code: 'ru', name: 'Russian' }, { code: 'tr', name: 'Turkish' },
  { code: 'so', name: 'Somali' }, { code: 'am', name: 'Amharic' }
];

const sourceLanguage = document.querySelector('#sourceLanguage');
const targetLanguage = document.querySelector('#targetLanguage');
const sourceText = document.querySelector('#sourceText');
const outputText = document.querySelector('#outputText');
const byteCount = document.querySelector('#byteCount');
const byteCountFooter = document.querySelector('#byteCountFooter');
const translateButton = document.querySelector('#translateButton');
const statusMessage = document.querySelector('#statusMessage');
const targetLanguageName = document.querySelector('#targetLanguageName');
const copyButton = document.querySelector('#copyButton');
const speakButton = document.querySelector('#speakButton');
const sourceSpeakButton = document.querySelector('#sourceSpeakButton');
const saveButton = document.querySelector('#saveButton');
const shareButton = document.querySelector('#shareButton');
const thumbsUpButton = document.querySelector('#thumbsUpButton');
const thumbsDownButton = document.querySelector('#thumbsDownButton');
const micButton = document.querySelector('#micButton');

function populateLanguages(select, selected) {
  select.replaceChildren(...languages.map(language => {
    const option = document.createElement('option');
    option.value = language.code;
    option.textContent = language.name;
    option.selected = language.code === selected;
    return option;
  }));
}

function setStatus(message = '', isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
}

function updateTargetLabel() {
  const target = languages.find(language => language.code === targetLanguage.value);
  targetLanguageName.textContent = target ? target.name : 'Translation';
}

function languageName(code) {
  return languages.find(language => language.code === code)?.name || code;
}

function updateSaveButton() {
  const saved = savedItems.some(item => item.source === sourceLanguage.value && item.target === targetLanguage.value && item.text === sourceText.value.trim() && item.translation === translatedValue);
  saveButton.disabled = !translatedValue;
  saveButton.setAttribute('aria-pressed', String(saved));
  saveButton.title = saved ? 'Remove saved translation' : 'Save translation';
}

function clearTranslation() {
  requestSequence++;
  requestController?.abort();
  requestController = undefined;
  translatedValue = '';
  translateButton.disabled = false;
  translateButton.textContent = 'Translate';
  outputText.textContent = 'Your translation will appear here.';
  outputText.classList.add('empty');
  copyButton.disabled = true;
  speakButton.disabled = true;
  shareButton.disabled = true;
  thumbsUpButton.disabled = true;
  thumbsDownButton.disabled = true;
  saveButton.disabled = true;
  saveButton.setAttribute('aria-pressed', 'false');
  setStatus('');
}

function updateInputCount() {
  const bytes = new TextEncoder().encode(sourceText.value).length;
  const count = numberFormat.format(bytes);
  byteCount.textContent = `${count} / ${MAX_BYTES} bytes`;
  byteCountFooter.textContent = `${count} / ${MAX_BYTES} bytes`;
  byteCount.classList.toggle('over-limit', bytes > MAX_BYTES);
  sourceSpeakButton.disabled = !sourceText.value.trim() || !('speechSynthesis' in window);
}

function setView(viewName) {
  document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === `${viewName}View`));
  document.querySelectorAll('.nav[data-view]').forEach(button => {
    const active = button.dataset.view === viewName;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function addHistory(entry) {
  historyItems.unshift({ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now() });
  historyItems = historyItems.slice(0, MAX_HISTORY);
  renderHistory();
}

function createEntry(item, saved = false) {
  const row = document.createElement('article');
  row.className = saved ? 'saved-entry' : 'history-entry';
  const header = document.createElement('div');
  header.className = 'history-entry-head';
  const pair = document.createElement('span');
  pair.className = 'history-pair';
  pair.textContent = `${languageName(item.source)} → ${languageName(item.target)}`;
  header.append(pair);
  if (saved) {
    const remove = document.createElement('button');
    remove.className = 'saved-remove';
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Remove saved translation');
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      savedItems = savedItems.filter(entry => entry.id !== item.id);
      persistSaved();
      renderSaved();
      updateSaveButton();
    });
    header.append(remove);
  } else {
    const time = document.createElement('time');
    time.className = 'history-time';
    time.dateTime = new Date(item.createdAt).toISOString();
    time.textContent = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(item.createdAt);
    header.append(time);
  }
  const source = document.createElement('p');
  source.className = 'history-source';
  source.textContent = item.text;
  const result = document.createElement('p');
  result.className = 'history-result';
  result.textContent = item.translation;
  const actions = document.createElement('div');
  actions.className = 'history-entry-actions';
  const restore = document.createElement('button');
  restore.type = 'button';
  restore.className = 'restore-button';
  restore.textContent = 'Open translation';
  restore.addEventListener('click', () => restoreEntry(item, saved));
  actions.append(restore);
  row.append(header, source, result, actions);
  return row;
}

function renderHistory() {
  const list = document.querySelector('#historyList');
  const empty = document.querySelector('#historyEmpty');
  const clearButton = document.querySelector('#clearHistoryButton');
  list.replaceChildren(...historyItems.map(item => createEntry(item)));
  empty.hidden = historyItems.length > 0;
  clearButton.hidden = historyItems.length === 0;
}

function renderSaved() {
  const list = document.querySelector('#savedList');
  const empty = document.querySelector('#savedEmpty');
  const clearButton = document.querySelector('#clearSavedButton');
  list.replaceChildren(...savedItems.map(item => createEntry(item, true)));
  empty.hidden = savedItems.length > 0;
  clearButton.hidden = savedItems.length === 0;
}

function persistSaved() {
  try { localStorage.setItem('linguaSaved', JSON.stringify(savedItems)); }
  catch { setStatus('Saved phrases are unavailable in this browser.', true); }
}

function restoreEntry(item, saved = false) {
  clearTranslation();
  sourceLanguage.value = item.source;
  targetLanguage.value = item.target;
  sourceText.value = item.text;
  translatedValue = item.translation;
  outputText.textContent = item.translation;
  outputText.classList.remove('empty');
  copyButton.disabled = false;
  speakButton.disabled = !('speechSynthesis' in window);
  shareButton.disabled = false;
  thumbsUpButton.disabled = false;
  thumbsDownButton.disabled = false;
  updateSaveButton();
  updateTargetLabel();
  updateInputCount();
  setStatus(saved ? 'Saved translation restored.' : 'Translation restored from this session.');
  setView('translate');
}

function renderSavedButtonState() { updateSaveButton(); }

async function translate() {
  const text = sourceText.value.trim();
  const source = sourceLanguage.value;
  const target = targetLanguage.value;
  const bytes = new TextEncoder().encode(text).length;
  if (!text) { setStatus('Enter some text to translate.', true); sourceText.focus(); return; }
  if (bytes > MAX_BYTES) { setStatus('Please shorten your text to 500 bytes or less.', true); sourceText.focus(); return; }
  if (source === target) { setStatus('Choose two different languages.', true); return; }

  clearTranslation();
  const requestId = ++requestSequence;
  requestController = new AbortController();
  translateButton.disabled = true;
  translateButton.textContent = 'Translating…';
  setStatus('Translating your text…');
  const params = new URLSearchParams({ q: text, langpair: `${source}|${target}`, mt: '1' });
  try {
    const response = await fetch(`${API_ENDPOINT}?${params.toString()}`, { signal: requestController.signal });
    if (!response.ok) throw new Error(`Translation service returned ${response.status}. Please try again.`);
    const data = await response.json();
    if (Number(data.responseStatus) !== 200 || !data.responseData?.translatedText) {
      throw new Error(data.responseDetails || 'No translation was returned. Try another language pair.');
    }
    translatedValue = data.responseData.translatedText;
    outputText.textContent = translatedValue;
    outputText.classList.remove('empty');
    copyButton.disabled = false;
    speakButton.disabled = !('speechSynthesis' in window);
    shareButton.disabled = false;
    thumbsUpButton.disabled = false;
    thumbsDownButton.disabled = false;
    updateSaveButton();
    addHistory({ text, translation: translatedValue, source, target });
    setStatus('Translation ready.');
  } catch (error) {
    if (error.name !== 'AbortError') setStatus(error.message || 'Could not reach the translation service. Check your connection and try again.', true);
  } finally {
    if (requestId === requestSequence) {
      translateButton.disabled = false;
      translateButton.textContent = 'Translate';
      requestController = undefined;
    }
  }
}

populateLanguages(sourceLanguage, 'en');
populateLanguages(targetLanguage, 'sw');
updateTargetLabel();
updateInputCount();
renderHistory();
renderSaved();
renderSavedButtonState();

document.querySelectorAll('.nav[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
document.querySelector('#clearHistoryButton').addEventListener('click', () => { historyItems = []; renderHistory(); });
document.querySelector('#clearSavedButton').addEventListener('click', () => { savedItems = []; persistSaved(); renderSaved(); updateSaveButton(); });
translateButton.addEventListener('click', translate);
sourceText.addEventListener('input', () => { updateInputCount(); clearTranslation(); });
sourceLanguage.addEventListener('change', () => { updateTargetLabel(); clearTranslation(); });
targetLanguage.addEventListener('change', () => { updateTargetLabel(); clearTranslation(); });
document.querySelector('#clearButton').addEventListener('click', () => { sourceText.value = ''; updateInputCount(); clearTranslation(); sourceText.focus(); });
document.querySelector('#swapButton').addEventListener('click', () => {
  const oldSource = sourceLanguage.value;
  const oldTarget = targetLanguage.value;
  const oldInput = sourceText.value;
  if (requestController) clearTranslation();
  sourceLanguage.value = oldTarget;
  targetLanguage.value = oldSource;
  if (translatedValue) {
    sourceText.value = translatedValue;
    translatedValue = oldInput;
    outputText.textContent = translatedValue || 'Your translation will appear here.';
    outputText.classList.toggle('empty', !translatedValue);
    copyButton.disabled = !translatedValue;
    speakButton.disabled = !translatedValue || !('speechSynthesis' in window);
    shareButton.disabled = !translatedValue;
    thumbsUpButton.disabled = !translatedValue;
    thumbsDownButton.disabled = !translatedValue;
    setStatus('Languages and text swapped.');
  } else clearTranslation();
  updateTargetLabel();
  updateInputCount();
  updateSaveButton();
});
copyButton.addEventListener('click', async () => {
  if (!translatedValue) return;
  try { await navigator.clipboard.writeText(translatedValue); setStatus('Translation copied.'); }
  catch { setStatus('Copy is unavailable in this browser. Select the translated text to copy it.', true); }
});
speakButton.addEventListener('click', () => {
  if (!translatedValue || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(translatedValue);
  utterance.lang = targetLanguage.value;
  window.speechSynthesis.speak(utterance);
});
sourceSpeakButton.addEventListener('click', () => {
  const text = sourceText.value.trim();
  if (!text || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = sourceLanguage.value;
  window.speechSynthesis.speak(utterance);
});
saveButton.addEventListener('click', () => {
  if (!translatedValue) return;
  const existing = savedItems.find(item => item.source === sourceLanguage.value && item.target === targetLanguage.value && item.text === sourceText.value.trim() && item.translation === translatedValue);
  if (existing) savedItems = savedItems.filter(item => item.id !== existing.id);
  else savedItems.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, source: sourceLanguage.value, target: targetLanguage.value, text: sourceText.value.trim(), translation: translatedValue, savedAt: Date.now() });
  persistSaved();
  renderSaved();
  updateSaveButton();
  setStatus(existing ? 'Removed from saved translations.' : 'Translation saved.');
});
shareButton.addEventListener('click', async () => {
  if (!translatedValue) return;
  const shareText = `${sourceText.value.trim()} — ${translatedValue}`;
  try {
    if (navigator.share) await navigator.share({ title: 'Lingua translation', text: shareText });
    else { await navigator.clipboard.writeText(shareText); setStatus('Translation copied for sharing.'); }
  } catch (error) { if (error.name !== 'AbortError') setStatus('Sharing is unavailable in this browser.', true); }
});
thumbsUpButton.addEventListener('click', () => setStatus('Thanks for your feedback.'));
thumbsDownButton.addEventListener('click', () => setStatus('Thanks for letting us know.'));
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  micButton.disabled = true;
  micButton.title = 'Speech input is not supported in this browser';
} else micButton.addEventListener('click', () => {
  const recognition = new SpeechRecognition();
  recognition.lang = sourceLanguage.value;
  recognition.interimResults = false;
  recognition.onstart = () => setStatus('Listening…');
  recognition.onresult = event => {
    sourceText.value = `${sourceText.value} ${event.results[0][0].transcript}`.trim();
    updateInputCount();
    clearTranslation();
  };
  recognition.onerror = () => setStatus('Speech input could not start. Check microphone access.', true);
  recognition.onend = () => { if (statusMessage.textContent === 'Listening…') setStatus(''); };
  recognition.start();
});
sourceText.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') translate(); });
