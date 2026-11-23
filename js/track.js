/* 방문 통계 비콘 — 개인을 식별하지 않는 집계용 이벤트만 보냅니다.
 * 쿠키·IP·입력값·개인정보를 저장하지 않습니다. session_id는 탭을 닫으면 사라지는 무작위 값입니다.
 * Do Not Track / Global Privacy Control이 켜져 있으면 아무것도 보내지 않습니다. 실패해도 조용히 무시합니다.
 * 이벤트: pageview, calc_done(사용자 조작 뒤 결과가 화면에 그려짐), cta_click(제휴·광고 버튼, data-campaign 캠페인 ID 포함), outbound(그 밖의 외부 링크), share(공유 버튼)
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

  // calc_done: 계산 결과가 실제로 화면에 그려졌을 때만 셉니다.
  //  - 결과 영역: #out 또는 [data-lc-result="이름"] (hidden이 풀리고 글자가 있을 때)
  //  - 사용자가 5초 안에 직접 조작(제출·입력·클릭)한 경우만 셉니다. 페이지 열자마자 기본값으로 그린 결과는 세지 않습니다.
  //  - 버튼만으로 진단하는 페이지는 결과를 보여 준 뒤 window.__lcTrack('calc_done', '이름')을 직접 부르면 됩니다.
  var RESULT_SEL = '#out,[data-lc-result]';
  var lastCalc = 0, lastUser = 0;
  function markUser(e) { if (e && e.isTrusted !== false) lastUser = Date.now(); }
  ['submit', 'input', 'change', 'click'].forEach(function (t) { d.addEventListener(t, markUser, true); });
  function shown(el) {
    for (var x = el; x && x.nodeType === 1; x = x.parentElement) { if (x.hidden) return false; }
    return !!(el.textContent && el.textContent.trim());
  }
  function resultOf(node) {
    var el = node && (node.nodeType === 1 ? node : node.parentElement);
    return el && el.closest ? el.closest(RESULT_SEL) : null;
  }
  function onResult(el) {
    var t = Date.now();
    if (!el || !shown(el) || t - lastUser > 5000 || t - lastCalc < 2000) return;
    lastCalc = t;
    send('calc_done', el.getAttribute('data-lc-result') || el.id || null);
  }
  try {
    if (w.MutationObserver && d.body) {
      new MutationObserver(function (list) {
        var seen = [];
        for (var i = 0; i < list.length; i++) {
          var r = resultOf(list[i].target);
          if (r && seen.indexOf(r) < 0) { seen.push(r); onResult(r); }
        }
      }).observe(d.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
    }
  } catch (e) {}

  // cta_click 대상: 버튼(또는 상위 요소)의 data-campaign 값을 캠페인 ID로 함께 보냅니다. 예: "dbsense_internet_l7no@l7nopd392j.sens.kr/"
  //  data-campaign이 없으면 주소 + 허용된 캠페인 번호 파라미터(i, sid, cid)만 붙입니다. 그 밖의 쿼리값은 보내지 않습니다.
  var ID_RE = /^[A-Za-z0-9_.:-]{1,60}$/;
  function ctaTarget(el, u) {
    var base = u.hostname + u.pathname;
    var holder = el.closest ? el.closest('[data-campaign]') : null;
    var cid = holder ? String(holder.getAttribute('data-campaign') || '').trim() : '';
    if (cid && ID_RE.test(cid)) return cid + '@' + base;
    var keep = [];
    ['i', 'sid', 'cid'].forEach(function (k) { var v = u.searchParams.get(k); if (v && ID_RE.test(v)) keep.push(k + '=' + v); });
    return keep.length ? base + '?' + keep.join('&') : base;
  }
  w.__lcCtaTarget = ctaTarget; // 테스트용

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
      if (/sponsored/.test(rel) || el.hasAttribute('data-cta')) send('cta_click', ctaTarget(el, u));
      else if (/^https?:$/.test(u.protocol) && u.hostname !== location.hostname) send('outbound', u.hostname);
    } catch (x) {}
  }, true);

  // navigator.share를 쓰는 공유 버튼도 잡습니다.
  try {
    if (n.share) { var orig = n.share.bind(n); n.share = function (data) { send('share', 'native'); return orig(data); }; }
  } catch (e) {}

  send('pageview');
})();
