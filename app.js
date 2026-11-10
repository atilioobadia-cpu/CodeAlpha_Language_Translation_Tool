const API_ENDPOINT = 'https://api.mymemory.translated.net/get';
const MAX_BYTES = 500;
const numberFormat = new Intl.NumberFormat();
let requestSequence = 0;
const languages = [
  { code: 'en', name: 'English' },
  { code: 'sw', name: 'Swahili' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'so', name: 'Somali' },
  { code: 'am', name: 'Amharic' }
];

const sourceLanguage = document.querySelector('#sourceLanguage');
const targetLanguage = document.querySelector('#targetLanguage');
const sourceText = document.querySelector('#sourceText');
const outputText = document.querySelector('#outputText');
const byteCount = document.querySelector('#byteCount');
const translateButton = document.querySelector('#translateButton');
const statusMessage = document.querySelector('#statusMessage');
const targetLanguageName = document.querySelector('#targetLanguageName');
const copyButton = document.querySelector('#copyButton');
const speakButton = document.querySelector('#speakButton');
let translatedValue = '';
let requestController;

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
  setStatus('');
}

function updateInputCount() {
  const bytes = new TextEncoder().encode(sourceText.value).length;
  byteCount.textContent = `${numberFormat.format(bytes)} / ${MAX_BYTES} bytes`;
  byteCount.classList.toggle('over-limit', bytes > MAX_BYTES);
}

function updateTargetLabel() {
  const target = languages.find(language => language.code === targetLanguage.value);
  targetLanguageName.textContent = target ? target.name : 'Translation';
}

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

translateButton.addEventListener('click', translate);
sourceText.addEventListener('input', () => { updateInputCount(); clearTranslation(); });
sourceLanguage.addEventListener('change', () => { updateTargetLabel(); clearTranslation(); });
targetLanguage.addEventListener('change', () => { updateTargetLabel(); clearTranslation(); });
document.querySelector('#clearButton').addEventListener('click', () => { sourceText.value = ''; updateInputCount(); clearTranslation(); sourceText.focus(); });
document.querySelector('#swapButton').addEventListener('click', () => {
  const oldSource = sourceLanguage.value;
  const oldTarget = targetLanguage.value;
  const oldInput = sourceText.value;
  sourceLanguage.value = oldTarget;
  targetLanguage.value = oldSource;
  if (translatedValue) {
    sourceText.value = translatedValue;
    translatedValue = oldInput;
    outputText.textContent = translatedValue || 'Your translation will appear here.';
    outputText.classList.toggle('empty', !translatedValue);
    copyButton.disabled = !translatedValue;
    speakButton.disabled = !translatedValue || !('speechSynthesis' in window);
    setStatus('Languages and text swapped.');
  } else {
    clearTranslation();
  }
  updateTargetLabel();
  updateInputCount();
});
copyButton.addEventListener('click', async () => {
  if (!translatedValue) return;
  try {
    await navigator.clipboard.writeText(translatedValue);
    setStatus('Translation copied.');
  } catch {
    setStatus('Copy is unavailable in this browser. Select the translated text to copy it.', true);
  }
});
speakButton.addEventListener('click', () => {
  if (!translatedValue || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(translatedValue);
  utterance.lang = targetLanguage.value;
  window.speechSynthesis.speak(utterance);
});
sourceText.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') translate();
});