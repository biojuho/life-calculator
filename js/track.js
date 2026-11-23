/* 방문 통계 비콘 — 개인을 식별하지 않는 집계용 이벤트만 보냅니다.
 * 쿠키·IP·입력값·개인정보를 저장하지 않습니다. session_id는 탭을 닫으면 사라지는 무작위 값입니다.
 * Do Not Track / Global Privacy Control이 켜져 있으면 아무것도 보내지 않습니다. 실패해도 조용히 무시합니다.
 * 이벤트: pageview, calc_done(계산 실행), cta_click(제휴·광고 버튼), outbound(그 밖의 외부 링크), share(공유 버튼)
 */
(function () {
  'use strict';
  var ENDPOINT = 'https://oeoboplyxfnuiireeoiy.supabase.co/functions/v1/lc-track';
  var w = window, d = document, n = navigator;
  try {
    if (w.__lcTrack) return;
    var dnt = n.doNotTrack == '1' || w.doNotTrack == '1' || n.msDoNotTrack == '1' || n.globalPrivacyControl === true;
    if (dnt) return;
    var host = location.hostname;
    if (!/(^|\.)biojuho\.github\.io$|(^|\.)joolife\.io\.kr$/.test(host)) return; // 로컬·미리보기에서는 보내지 않음
  } catch (e) { return; }

  function sid() {
    try {
      var k = 'lc_sid', v = sessionStorage.getItem(k);
      if (!v) {
        var a = new Uint8Array(9); (w.crypto || w.msCrypto).getRandomValues(a);
        v = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
        sessionStorage.setItem(k, v);
      }
      return v;
    } catch (e) { return null; }
  }
  function device() {
    var ua = n.userAgent || '';
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet';
    if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile';
    return 'desktop';
  }
  function refHost() {
    try {
      if (!d.referrer) return null;
      var h = new URL(d.referrer).hostname;
      return h === location.hostname ? null : h;
    } catch (e) { return null; }
  }
  var q = (function () { try { return new URLSearchParams(location.search); } catch (e) { return { get: function () { return null; } }; } })();
  var base = {
    path: location.pathname,
    ref_host: refHost(),
    utm_source: q.get('utm_source'),
    utm_medium: q.get('utm_medium'),
    utm_campaign: q.get('utm_campaign'),
    device: device(),
    session_id: sid()
  };
  var sent = 0, lastShare = 0;
  function send(event, target) {
    try {
      if (sent++ > 40) return;
      var p = {}; for (var k in base) p[k] = base[k];
      if (event === 'share') { var now = Date.now(); if (now - lastShare < 1500) return; lastShare = now; }
      p.event = event; if (target) p.target = String(target).slice(0, 200);
      var body = JSON.stringify(p);
      if (n.sendBeacon && n.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return;
      if (w.fetch) w.fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
    } catch (e) {}
  }
  w.__lcTrack = send; // 페이지 스크립트에서 window.__lcTrack('share') 처럼 직접 부를 수 있음

  // calc_done: 사용자가 계산을 실행(폼 제출)하거나 입력을 바꿔 결과가 갱신될 때. 2초 안의 연속 이벤트는 한 번으로 셉니다.
  var lastCalc = 0, inputTimer = null;
  function calc() { var t = Date.now(); if (t - lastCalc < 2000) return; lastCalc = t; send('calc_done'); }
  d.addEventListener('submit', function (e) { if (e.target && e.target.tagName === 'FORM') calc(); }, true);
  function onInput(e) {
    var f = e.target && e.target.form; if (!f || e.isTrusted === false) return;
    clearTimeout(inputTimer); inputTimer = setTimeout(calc, 1500);
  }
  d.addEventListener('input', onInput, true);
  d.addEventListener('change', onInput, true);

  // 클릭: 제휴·광고 링크(rel=sponsored, data-cta) → cta_click, 그 밖의 외부 링크 → outbound, 공유 버튼 → share
  d.addEventListener('click', function (e) {
    try {
      var el = e.target && e.target.closest ? e.target.closest('a,button,[data-share],[data-cta]') : null;
      if (!el) return;
      if (el.matches('[data-share],.share,[class*="share"] button,button[class*="share"],[aria-label*="공유"]')) { send('share', el.getAttribute('data-share') || el.textContent.trim().slice(0, 40)); return; }
      var href = el.getAttribute('href') || el.getAttribute('data-cta');
      if (!href && !el.hasAttribute('data-cta')) return;
      var u; try { u = new URL(href || '', location.href); } catch (x) { return; }
      var rel = (el.getAttribute('rel') || '').toLowerCase();
      if (/sponsored/.test(rel) || el.hasAttribute('data-cta')) send('cta_click', u.hostname + u.pathname);
      else if (/^https?:$/.test(u.protocol) && u.hostname !== location.hostname) send('outbound', u.hostname);
    } catch (x) {}
  }, true);

  // navigator.share를 쓰는 공유 버튼도 잡습니다.
  try {
    if (n.share) { var orig = n.share.bind(n); n.share = function (data) { send('share', 'native'); return orig(data); }; }
  } catch (e) {}

  send('pageview');
})();
