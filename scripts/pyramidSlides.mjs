/**
 * Pyramid Slides — 산문 → 프레젠테이션 HTML
 */

export function generateSlidesHtml(prose, title) {
  const lines = prose.split('\n');
  const slides = [];
  let current = { heading: title, lines: [] };

  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (current.lines.length > 0 || current.heading !== title) {
        slides.push(current);
      }
      const level = line.startsWith('## ') ? 'section' : 'slide';
      const text = line.replace(/^#{2,3}\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1');
      current = { heading: text, level, lines: [] };
    } else if (line.trim()) {
      const cleaned = line
        .replace(/^\s*-\s+/, '')
        .replace(/\*\*(.+?)\*\*/g, '$1');
      const depth = (line.match(/^(\s*)/)[1].length / 2) | 0;
      current.lines.push({ text: cleaned, depth });
    }
  }
  if (current.lines.length > 0 || current.heading !== title) {
    slides.push(current);
  }

  // 서브 슬라이드 분할: depth 0 항목이 5개 이상이면 각 depth 0을 서브 슬라이드로
  const MAX_D0_PER_SLIDE = 4;
  const expanded = [];
  for (const slide of slides) {
    if (slide.level === 'section') {
      expanded.push(slide);
      continue;
    }

    // depth 0 항목 수 세기
    const d0Count = slide.lines.filter((l) => l.depth === 0).length;
    if (d0Count <= MAX_D0_PER_SLIDE) {
      expanded.push(slide);
      continue;
    }

    // depth 0 기준으로 분할
    const groups = [];
    let group = null;
    for (const item of slide.lines) {
      if (item.depth === 0) {
        if (group) groups.push(group);
        group = { lead: item, children: [] };
      } else if (group) {
        group.children.push(item);
      }
    }
    if (group) groups.push(group);

    // 인접한 작은 그룹을 묶어서 MAX_D0_PER_SLIDE 이하로
    let batch = [];
    for (const g of groups) {
      batch.push(g);
      if (batch.length >= MAX_D0_PER_SLIDE) {
        expanded.push({
          heading: slide.heading,
          level: 'slide',
          lines: batch.flatMap((b) => [b.lead, ...b.children]),
        });
        batch = [];
      }
    }
    if (batch.length > 0) {
      expanded.push({
        heading: slide.heading,
        level: 'slide',
        lines: batch.flatMap((b) => [b.lead, ...b.children]),
      });
    }
  }

  const slidesJson = JSON.stringify(expanded);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif; background: #0a0a0a; color: #e0e0e0; height: 100vh; overflow: hidden; }
  .slide { display: none; flex-direction: column; justify-content: center; padding: 8vh 10vw; height: 100vh; }
  .slide.active { display: flex; }
  .slide.section { justify-content: center; align-items: center; }
  .slide.section h1 { font-size: clamp(2rem, 5vw, 4rem); font-weight: 700; line-height: 1.3; text-align: center; color: #fff; }
  .slide h2 { font-size: clamp(1.4rem, 3vw, 2.2rem); font-weight: 600; line-height: 1.4; margin-bottom: 3vh; color: #fff; }
  .slide .body { display: flex; flex-direction: column; gap: 1.2vh; }
  .slide .body .item { font-size: clamp(1rem, 1.8vw, 1.4rem); line-height: 1.6; color: #bbb; }
  .slide .body .item.d0 { color: #e0e0e0; font-size: clamp(1.1rem, 2vw, 1.5rem); }
  .slide .body .item.d1 { padding-left: 2em; }
  .slide .body .item.d2 { padding-left: 4em; font-size: clamp(0.9rem, 1.5vw, 1.2rem); color: #999; }
  .slide .body .item.d3 { padding-left: 6em; font-size: clamp(0.85rem, 1.3vw, 1.1rem); color: #777; }
  .counter { position: fixed; bottom: 2vh; right: 3vw; font-size: 0.9rem; color: #555; }
  .progress { position: fixed; top: 0; left: 0; height: 3px; background: #4a9eff; transition: width 0.3s; }
</style>
</head>
<body>
<div class="progress" id="progress"></div>
<div id="deck"></div>
<div class="counter" id="counter"></div>
<script>
const slides = ${slidesJson};
let idx = 0;
const deck = document.getElementById('deck');
const counter = document.getElementById('counter');
const progress = document.getElementById('progress');

slides.forEach((s, i) => {
  const div = document.createElement('div');
  div.className = 'slide' + (s.level === 'section' ? ' section' : '') + (i === 0 ? ' active' : '');
  div.dataset.idx = i;
  if (s.level === 'section') {
    div.innerHTML = '<h1>' + esc(s.heading) + '</h1>';
  } else {
    let html = '<h2>' + esc(s.heading) + '</h2><div class="body">';
    for (const item of s.lines) {
      const d = Math.min(item.depth, 3);
      html += '<div class="item d' + d + '">' + esc(item.text) + '</div>';
    }
    html += '</div>';
    div.innerHTML = html;
  }
  deck.appendChild(div);
});

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function go(n) {
  const next = Math.max(0, Math.min(slides.length - 1, idx + n));
  if (next === idx) return;
  deck.children[idx].classList.remove('active');
  idx = next;
  deck.children[idx].classList.add('active');
  counter.textContent = (idx + 1) + ' / ' + slides.length;
  progress.style.width = ((idx + 1) / slides.length * 100) + '%';
}

counter.textContent = '1 / ' + slides.length;
progress.style.width = (1 / slides.length * 100) + '%';

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === ' ') go(1);
  else if (e.key === 'ArrowLeft') go(-1);
});
document.addEventListener('click', e => {
  if (e.clientX > window.innerWidth / 2) go(1); else go(-1);
});
</script>
</body>
</html>`;
}

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
