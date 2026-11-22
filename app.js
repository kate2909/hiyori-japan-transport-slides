const slides = [...document.querySelectorAll('.slide')];
const prev = document.getElementById('prev');
const next = document.getElementById('next');
const counter = document.getElementById('counter');
const slideTitle = document.getElementById('slide-title');
const progressBar = document.getElementById('progress-bar');
const panel = document.getElementById('sources-panel');
const toggle = document.getElementById('sources-toggle');
const close = document.getElementById('sources-close');
const scrim = document.getElementById('scrim');
let index = 0;
let catalog = [];
let lastFocus = null;

function pageFromHash() {
  const match = location.hash.match(/^#slide-(\d+)$/);
  return match ? Math.min(slides.length - 1, Math.max(0, Number(match[1]) - 1)) : 0;
}

function sourceLink(source) {
  const item = document.createElement('article');
  item.className = 'source-item';
  const id = document.createElement('strong');
  id.textContent = source.id + ' · ' + source.agency;
  const heading = document.createElement('h3');
  heading.textContent = source.original_title;
  const desc = document.createElement('p');
  desc.textContent = source.summary;
  const link = document.createElement('a');
  link.href = source.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = '查看官方原始頁面';
  item.append(id, heading, desc, link);
  return item;
}

function renderSources() {
  const current = slides[index];
  const ids = current.dataset.sources.split(',');
  const list = document.getElementById('source-list');
  list.replaceChildren();
  const refs = ids.map(id => catalog.find(source => source.id === id)).filter(Boolean);
  if (!refs.length) {
    const warning = document.createElement('p');
    warning.textContent = '來源清單尚未載入，請稍後重新整理。';
    list.append(warning);
  } else {
    refs.forEach(source => list.append(sourceLink(source)));
  }
  const wiki = document.createElement('div');
  wiki.className = 'wiki-links';
  const title = document.createElement('h3');
  title.textContent = '對應 Wiki 文章';
  wiki.append(title);
  current.dataset.wiki.split('|').forEach(path => {
    const link = document.createElement('a');
    link.href = path.replace(/\.md$/, '.html');
    link.textContent = path;
    const line = document.createElement('code');
    line.append(link);
    wiki.append(line);
  });
  list.append(wiki);
}

function renderAllSources() {
  const container = document.getElementById('all-sources');
  container.replaceChildren();
  catalog.forEach(source => {
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = source.id + ' · ' + source.agency;
    container.append(link);
  });
}

function showSlide(newIndex, updateHash = true) {
  index = Math.min(slides.length - 1, Math.max(0, newIndex));
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
    slide.setAttribute('aria-hidden', String(i !== index));
  });
  prev.disabled = index === 0;
  next.disabled = index === slides.length - 1;
  counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
  slideTitle.textContent = slides[index].getAttribute('aria-label');
  progressBar.style.width = ((index + 1) / slides.length * 100) + '%';
  document.title = slides[index].getAttribute('aria-label') + '｜跟著日和學日本交通';
  if (updateHash && location.hash !== '#slide-' + (index + 1)) history.replaceState(null, '', '#slide-' + (index + 1));
  renderSources();
  window.scrollTo({top: 0, behavior: 'instant'});
}

function openSources() {
  lastFocus = document.activeElement;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  toggle.setAttribute('aria-expanded', 'true');
  scrim.hidden = false;
  close.focus();
}

function closeSources() {
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  toggle.setAttribute('aria-expanded', 'false');
  scrim.hidden = true;
  if (lastFocus) lastFocus.focus();
}

prev.addEventListener('click', () => showSlide(index - 1));
next.addEventListener('click', () => showSlide(index + 1));
document.querySelectorAll('.next-trigger').forEach(button => button.addEventListener('click', () => showSlide(index + 1)));
toggle.addEventListener('click', openSources);
close.addEventListener('click', closeSources);
scrim.addEventListener('click', closeSources);
window.addEventListener('hashchange', () => showSlide(pageFromHash(), false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && panel.classList.contains('open')) { closeSources(); return; }
  if (panel.classList.contains('open')) return;
  if (event.key === 'ArrowRight' || event.key === 'PageDown') showSlide(index + 1);
  if (event.key === 'ArrowLeft' || event.key === 'PageUp') showSlide(index - 1);
});
document.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => {
  const correct = button.dataset.answer === 'correct';
  document.querySelectorAll('[data-answer]').forEach(choice => choice.classList.remove('selected', 'wrong'));
  button.classList.add(correct ? 'selected' : 'wrong');
  document.getElementById('quiz-feedback').textContent = correct
    ? '答對了！JR 北海道明示，小樽往余市、俱知安、新雪谷方向不能繼續使用 Suica 等 IC 卡。[SRC-009]'
    : '再想想：IC 卡有適用範圍。小樽以西的這些方向需先確認並購票。[SRC-009]';
}));

showSlide(pageFromHash(), false);
fetch('provenance.json').then(response => {
  if (!response.ok) throw new Error('來源檔載入失敗');
  return response.json();
}).then(data => {
  catalog = data.sources;
  renderSources();
  renderAllSources();
}).catch(error => {
  console.error(error);
  renderSources();
});
