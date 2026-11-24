/* 위젯(iframe) 모드 — 주소에 ?embed=1 이 붙으면 머리말·메뉴·사이드·꼬리말을 숨기고
 * 결과 높이를 부모 창에 알려 줍니다(postMessage, 숫자 하나만 보냄 · 입력값은 보내지 않음).
 * 출처 표시 링크 1줄은 항상 남깁니다.
 */
(function () {
  'use strict';
  var q;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  if (q.get('embed') !== '1') return;
  var root = document.documentElement;
  root.classList.add('embed');
  function credit() {
    if (document.getElementById('lc-credit')) return;
    var p = document.createElement('p');
    p.id = 'lc-credit';
    p.className = 'fine embed-credit';
    var a = document.createElement('a');
    a.href = location.origin + location.pathname;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = '생활계산서 계산기로 계산 · 결과는 참고용';
    p.appendChild(a);
    var panel = document.querySelector('.panel') || document.body;
    panel.appendChild(p);
  }
  var last = 0;
  function report() {
    var h = Math.ceil(document.body.scrollHeight);
    if (h === last) return;
    last = h;
    try { parent.postMessage({ type: 'lc-embed-height', height: h }, '*'); } catch (e) { /* 무시 */ }
  }
  function start() {
    credit();
    report();
    if (window.ResizeObserver) new ResizeObserver(report).observe(document.body);
    else setInterval(report, 800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
