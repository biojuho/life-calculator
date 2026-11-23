/* 인터넷 요금 비교: 진단 카드·공유 PNG·상담 CTA 마크업. 캠페인 문구·URL은 cta-config.js에서만 바꿉니다. */

import { shortShareHost } from './internet-diagnosis.mjs';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

export const SHARE_CARD_WIDTH = 900;
export const SHARE_CARD_HEIGHT = 1200;

const svgCalc = `<svg class="cta-step-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="7" y="5" width="10" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="13" r="1.05" fill="currentColor"/><circle cx="12" cy="13" r="1.05" fill="currentColor"/><circle cx="15.5" cy="13" r="1.05" fill="currentColor"/><circle cx="8.5" cy="17.2" r="1.05" fill="currentColor"/><circle cx="12" cy="17.2" r="1.05" fill="currentColor"/><rect x="14.4" y="16.1" width="2.3" height="2.3" rx="0.5" fill="currentColor"/></svg>`;
const svgForm = `<svg class="cta-step-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4.5h3.2a2.8 2.8 0 0 0 5.6 0H16A2.5 2.5 0 0 1 18.5 7v12A2.5 2.5 0 0 1 16 21.5H8A2.5 2.5 0 0 1 5.5 19V7A2.5 2.5 0 0 1 8 4.5z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9.5 12.2l2 2 3.6-3.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const svgPhone = `<svg class="cta-step-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 3.8c.4-.4 1-.5 1.5-.3l2 1c.5.2.8.7.8 1.3v2.1c0 .4-.2.8-.5 1.1l-1.2 1.2a12 12 0 0 0 5 5l1.2-1.2c.3-.3.7-.5 1.1-.5h2.1c.6 0 1.1.3 1.3.8l1 2c.2.5.1 1.1-.3 1.5l-1.5 1.5c-.4.4-1 .6-1.6.5C11.4 20.3 3.7 12.6 3.3 5.9c-.1-.6.1-1.2.5-1.6L8.2 3.8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`;

function fmtWon(won, n) {
  return typeof won === 'function' ? won(n) : `${Math.round(Number(n) || 0).toLocaleString('ko-KR')}원`;
}

export function shareCardPayload({ diagnosis, options, shareUrl } = {}) {
  const stay = options && options.stay ? options.stay.total : 0;
  const change = options && options.change ? options.change.total : 0;
  return {
    title: '인터넷 요금 진단',
    headline: (diagnosis && diagnosis.headline) || '',
    score: diagnosis ? diagnosis.score : 0,
    lossLabel: (diagnosis && diagnosis.lossLabel) || '',
    stayTotal: stay,
    changeTotal: change,
    stayLabel: '유지',
    changeLabel: '변경',
    stayNote: '유지하면 혜택 0원',
    fine: '입력값 기준 참고치, 실제 사은품·위약금은 상담·통신사 확인',
    source: '생활계산서 인터넷 요금 비교',
    url: shortShareHost(shareUrl),
  };
}

export function buildDiagnosisHtml({ diagnosis, options, term, won, shareUrl } = {}) {
  if (!diagnosis || !options) return '';
  const fmt = (n) => fmtWon(won, n);
  const scoreClass = diagnosis.warnLoss ? ' is-warn' : '';
  const loss = diagnosis.lossLabel
    ? `<span class="diag-loss">${esc(diagnosis.lossLabel)}</span>`
    : '';
  const opt = (o, extra = '') => {
    const best = o.isBest ? ' is-best' : '';
    const note = o.note ? `<p class="diag-opt-note${o.key === 'stay' ? ' diag-opt-zero' : ''}">${esc(o.note)}</p>` : '';
    return `<div class="diag-opt${best}" data-opt="${esc(o.key)}">
      <p class="diag-opt-k">${esc(o.label)}</p>
      <p class="diag-opt-amt">${esc(fmt(o.total))}</p>
      ${extra}${note}
    </div>`;
  };
  const termN = term || (options.term || '');
  return `<div class="diag-head">
    <div>
      <p class="diag-kicker">인터넷 요금 진단 · ${esc(String(termN))}개월 총비용</p>
      <p class="diag-headline">${esc(diagnosis.headline)}</p>
    </div>
    <div class="diag-score${scoreClass}">
      <span class="diag-score-num">${esc(String(diagnosis.score))}</span>
      <span class="diag-score-unit">점</span>
      ${loss}
    </div>
  </div>
  <div class="diag-options">
    ${opt(options.stay)}
    ${opt(options.renew)}
    ${opt(options.change)}
  </div>
  <div class="diag-share" data-share-url="${esc(shareUrl || '')}">
    <button type="button" class="sec" data-share-act="download">이미지 저장</button>
    <button type="button" class="sec" data-share-act="copy">링크 복사</button>
    <button type="button" class="sec" data-share-act="share">공유하기</button>
  </div>
  <p class="diag-share-status" data-share-status hidden></p>
  <p class="diag-share-hint">가족 단톡 예시: “우리 집 인터넷 약정 끝났는지 1분 만에 나옴”</p>
  <p class="diag-fine">입력값 기준 참고치입니다. 실제 사은품·위약금은 상담·통신사에서 확인하세요. 공유 링크는 이 계산 입력값만 담고, 서버로 보내지 않습니다.</p>
  <canvas class="share-canvas" width="${SHARE_CARD_WIDTH}" height="${SHARE_CARD_HEIGHT}" hidden></canvas>`;
}

export function buildInternetCtaHtml({
  cta, live, diagnosis, won,
} = {}) {
  if (!cta) return '';
  const eyebrow = cta.eyebrow || (`광고 · 제휴 링크${cta.partner ? ' · ' + cta.partner : ''}`);
  const warn = diagnosis && diagnosis.warnLoss;
  const label = warn ? (cta.weakLabel || '만료 달력만 받아 두기') : (cta.label || '상담 받고 절약액 확인하기');
  const hint = (diagnosis && diagnosis.ctaHint) || cta.consultOnly || '상담만 요청, 가입은 나중에';
  const weakClass = warn ? ' is-weak' : '';
  const btn = live
    ? `<a class="btn cta-go${weakClass}" href="${esc(cta.url)}" target="_blank" rel="sponsored noopener">${esc(label)}</a>`
    : `<span class="btn cta-go${weakClass}" aria-disabled="true">준비 중</span>`;
  const caption = cta.heroCaption || '이미지는 AI로 만든 예시입니다';

  return `<p class="aff-label">${esc(eyebrow)}</p>
<figure class="cta-hero-wrap" hidden>
  <img class="cta-hero" src="assets/cta-hero.svg" alt="" width="1200" height="800">
  <figcaption class="cta-hero-caption">${esc(caption)}</figcaption>
</figure>
<p class="cta-headline">${esc(cta.headline)}</p>
<div class="cta-visual">
  <div class="cta-thumb-col">
    <img class="cta-thumb" alt="방금 계산한 요금 진단 카드" hidden>
  </div>
  <div class="cta-main">
    <div class="cta-badge-wrap">
      <p class="cta-badge">${esc(cta.badge)}</p>
      <p class="cta-benefit">${esc(cta.benefit)}</p>
      <p class="cta-badge-note">${esc(cta.badgeNote)}</p>
    </div>
    <ol class="cta-steps">
      <li>${svgCalc}<span>계산</span></li>
      <li>${svgForm}<span>무료 상담 신청</span></li>
      <li>${svgPhone}<span>혜택 안내 전화</span></li>
    </ol>
  </div>
</div>
<div class="cta-legal">
  ${cta.audience ? `<p class="fine cta-audience">${esc(cta.audience)}</p>` : ''}
  <p class="fine">${esc(cta.stayNote)}</p>
  <p class="fine">${esc(cta.restriction)}</p>
  <p class="fine cta-disclosure">${esc(cta.disclosure)}</p>
</div>
${btn}
<p class="cta-consult-only">${esc(hint)}</p>`;
}

export function bindCtaHero(root) {
  const wrap = root && root.querySelector && root.querySelector('figure.cta-hero-wrap');
  const img = root && root.querySelector && root.querySelector('img.cta-hero');
  if (!img) return;
  const show = () => {
    img.hidden = false;
    if (wrap) wrap.hidden = false;
  };
  const hide = () => {
    img.hidden = true;
    if (wrap) wrap.hidden = true;
  };
  img.addEventListener('load', show);
  img.addEventListener('error', hide);
  if (img.complete) {
    if (img.naturalWidth > 0) show();
    else hide();
  }
}

function fillRound(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, rad);
    ctx.fill();
    return;
  }
  ctx.fillRect(x, y, w, h);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const chars = String(text || '').split('');
  const lines = [];
  let line = '';
  for (const ch of chars) {
    const trial = line + ch;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  const used = maxLines ? lines.slice(0, maxLines) : lines;
  used.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineHeight));
  return used.length * lineHeight;
}

export function drawShareCard(ctx, payload = {}, width = SHARE_CARD_WIDTH, height = SHARE_CARD_HEIGHT) {
  const p = payload;
  const ink = '#1c1712';
  const ink2 = '#4a4036';
  const stamp = '#b33b32';
  const green = '#1f4f43';
  const paper = '#f3efe6';
  const card = '#fffcf7';
  const rule = '#d9cfc0';
  const gold = '#c4a15a';
  const serif = '"Gowun Batang", "NanumMyeongjo", "Noto Serif CJK KR", serif';
  const sans = '"Pretendard", "Noto Sans CJK KR", "NanumGothic", sans-serif';

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = card;
  fillRound(ctx, 48, 48, width - 96, height - 96, 28);

  ctx.strokeStyle = rule;
  ctx.lineWidth = 2;
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(48, 48, width - 96, height - 96, 28);
    ctx.stroke();
  } else {
    ctx.strokeRect(48, 48, width - 96, height - 96);
  }

  // 상단 워드마크
  ctx.fillStyle = stamp;
  ctx.beginPath();
  ctx.arc(110, 120, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff8f6';
  ctx.font = `700 18px ${serif}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('計', 110, 121);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = ink;
  ctx.font = `700 22px ${serif}`;
  ctx.fillText('생활계산서', 146, 116);
  ctx.fillStyle = ink2;
  ctx.font = `600 14px ${sans}`;
  ctx.fillText('바로 쓰는 생활 계산기', 146, 138);

  ctx.fillStyle = gold;
  ctx.fillRect(80, 168, width - 160, 2);

  ctx.fillStyle = stamp;
  ctx.font = `800 13px ${sans}`;
  ctx.fillText('INTERNET BILL', 80, 200);

  ctx.fillStyle = ink;
  ctx.font = `700 36px ${serif}`;
  ctx.fillText(p.title || '인터넷 요금 진단', 80, 248);

  // 한 줄 헤드라인
  ctx.fillStyle = green;
  ctx.font = `700 42px ${serif}`;
  const head = p.headline || '';
  wrapText(ctx, head, 80, 320, width - 160, 54, 3);

  // 점수
  const scoreX = width - 170;
  const scoreY = 430;
  ctx.fillStyle = p.lossLabel ? '#f6e4e1' : '#e4efe8';
  fillRound(ctx, scoreX - 10, scoreY - 58, 100, p.lossLabel ? 110 : 90, 16);
  ctx.fillStyle = p.lossLabel ? stamp : green;
  ctx.textAlign = 'center';
  ctx.font = `700 40px ${serif}`;
  ctx.fillText(String(p.score ?? 0), scoreX + 40, scoreY);
  ctx.font = `700 14px ${sans}`;
  ctx.fillText('점', scoreX + 40, scoreY + 22);
  if (p.lossLabel) {
    ctx.font = `800 10px ${sans}`;
    ctx.fillText(p.lossLabel, scoreX + 40, scoreY + 42);
  }

  // 막대
  const stay = Math.max(0, Number(p.stayTotal) || 0);
  const change = Math.max(0, Number(p.changeTotal) || 0);
  const max = Math.max(stay, change, 1);
  const barX = 80;
  const barW = width - 160;
  const barY1 = 560;
  const barY2 = 680;
  const labelAmt = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;

  const drawBar = (y, label, value, color, stronger) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = ink2;
    ctx.font = `800 14px ${sans}`;
    ctx.fillText(label, barX, y - 14);
    ctx.textAlign = 'right';
    ctx.fillStyle = stronger ? color : ink;
    ctx.font = `700 18px ${sans}`;
    ctx.fillText(labelAmt(value), barX + barW, y - 14);
    ctx.fillStyle = '#efe8dc';
    fillRound(ctx, barX, y, barW, 28, 8);
    const w = Math.max(8, (value / max) * barW);
    ctx.fillStyle = color;
    fillRound(ctx, barX, y, w, 28, 8);
  };

  const changeBetter = change < stay;
  drawBar(barY1, p.stayLabel || '유지', stay, '#8a7d6d', false);
  drawBar(barY2, p.changeLabel || '변경', change, green, changeBetter);

  // 유지 혜택 0원 대비
  ctx.textAlign = 'left';
  ctx.fillStyle = stamp;
  ctx.font = `800 20px ${sans}`;
  ctx.fillText(p.stayNote || '유지하면 혜택 0원', 80, 780);

  ctx.fillStyle = gold;
  ctx.fillRect(80, 820, width - 160, 1);

  ctx.fillStyle = ink2;
  ctx.font = `500 16px ${sans}`;
  wrapText(ctx, p.fine || '', 80, 860, width - 160, 26, 3);

  ctx.fillStyle = ink;
  ctx.font = `700 18px ${serif}`;
  ctx.fillText(p.source || '생활계산서 인터넷 요금 비교', 80, 1020);
  ctx.fillStyle = ink2;
  ctx.font = `600 15px ${sans}`;
  ctx.fillText(p.url || '', 80, 1050);
}

export async function renderShareCanvas(canvas, payload) {
  if (!canvas || !canvas.getContext) return null;
  const dpr = 2;
  canvas.width = SHARE_CARD_WIDTH * dpr;
  canvas.height = SHARE_CARD_HEIGHT * dpr;
  canvas.style.width = `${SHARE_CARD_WIDTH}px`;
  canvas.style.height = `${SHARE_CARD_HEIGHT}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch { /* ignore */ }
  }
  drawShareCard(ctx, payload, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
  return canvas;
}

function canvasPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('png'))), 'image/png');
  });
}

export function bindShareActions(root, { payload, shareUrl, onThumb } = {}) {
  if (!root) return;
  const canvas = root.querySelector('canvas.share-canvas');
  const status = root.querySelector('[data-share-status]');
  const setStatus = (msg) => {
    if (!status) return;
    status.hidden = !msg;
    status.textContent = msg || '';
  };

  const ready = canvas ? renderShareCanvas(canvas, payload || {}) : Promise.resolve(null);
  ready.then((c) => {
    if (c && typeof onThumb === 'function') {
      try { onThumb(c.toDataURL('image/png')); } catch { /* ignore */ }
    }
  });

  const download = async () => {
    const c = await ready;
    if (!c) return;
    const a = document.createElement('a');
    a.download = '인터넷요금진단.png';
    a.href = c.toDataURL('image/png');
    a.click();
    setStatus('이미지를 저장했습니다.');
  };

  const copyLink = async () => {
    const url = shareUrl || '';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setStatus('링크를 복사했습니다. 원하는 곳에 붙여 넣으세요.');
    } catch {
      setStatus(url ? `복사할 링크: ${url}` : '링크를 복사하지 못했습니다.');
    }
  };

  const share = async () => {
    const c = await ready;
    const url = shareUrl || '';
    const text = `${(payload && payload.headline) || '인터넷 요금 진단'}\n우리 집 인터넷 약정 끝났는지 1분 만에 나옴`;
    try {
      if (c && navigator.share) {
        const blob = await canvasPngBlob(c);
        const file = new File([blob], '인터넷요금진단.png', { type: 'image/png' });
        const data = { title: '인터넷 요금 진단', text, url };
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ ...data, files: [file] });
        } else {
          await navigator.share(data);
        }
        setStatus('공유 창을 열었습니다.');
        return;
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
    await copyLink();
  };

  root.querySelectorAll('[data-share-act]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const act = btn.getAttribute('data-share-act');
      if (act === 'download') download();
      else if (act === 'copy') copyLink();
      else if (act === 'share') share();
    });
  });
}
