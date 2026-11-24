/* 생활계산서 공유 바 (viral-share-20261124 초안)
 * - 계산 결과(#out)가 화면에 보이면 바로 아래에 공유 버튼 3개를 붙입니다.
 * - 공유 문구에는 사용자가 넣은 값·결과 숫자를 넣지 않습니다(연봉·대출액 등 개인정보 보호).
 * - 공유 주소에는 utm_source=share, utm_medium=<native|kakao|copy>, utm_campaign=<계산기 이름>을 붙입니다.
 * - 카카오톡 버튼은 window.LC_KAKAO_KEY(카카오 디벨로퍼스 JavaScript 키)가 있을 때만 보입니다.
 * - 클릭은 data-share 속성으로 track.js가 'share' 이벤트로 셉니다.
 */
(function (root) {
  function toolName(path) {
    var m = /\/tools\/([a-z0-9-]+)\/?/.exec(path || '');
    return m ? m[1] : 'home';
  }
  function buildShareUrl(base, medium, path) {
    var u = String(base || '').split('#')[0].split('?')[0];
    var med = /^(native|kakao|copy)$/.test(medium) ? medium : 'copy';
    return u + '?utm_source=share&utm_medium=' + med + '&utm_campaign=' + toolName(path || u);
  }
  var api = { buildShareUrl: buildShareUrl, toolName: toolName };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  var w = root, d = w.document;
  if (!d || /(^|[?&])embed=1(&|$)/.test(w.location.search)) return; // 위젯(임베드) 화면에서는 숨김
  function canonical() {
    var l = d.querySelector('link[rel="canonical"]');
    return (l && l.href) || (w.location.origin + w.location.pathname);
  }
  function title() {
    var m = d.querySelector('meta[property="og:title"]');
    return (m && m.content) || d.title;
  }
  function text() { return title() + ' — 2026년 기준으로 바로 계산해 보세요'; }
  function toast(el, msg) { el.textContent = msg; el.hidden = false; setTimeout(function () { el.hidden = true; }, 2200); }
  function copy(url, done) {
    if (w.navigator.clipboard && w.navigator.clipboard.writeText) {
      w.navigator.clipboard.writeText(url).then(done, function () { w.prompt('주소를 복사하세요', url); });
    } else { w.prompt('주소를 복사하세요', url); }
  }
  var kakaoLoading = null;
  function kakao(cb) {
    if (w.Kakao && w.Kakao.isInitialized && w.Kakao.isInitialized()) return cb();
    if (!kakaoLoading) {
      kakaoLoading = new Promise(function (res, rej) {
        var s = d.createElement('script');
        s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js';
        s.crossOrigin = 'anonymous'; s.onload = res; s.onerror = rej; d.head.appendChild(s);
      }).then(function () { if (!w.Kakao.isInitialized()) w.Kakao.init(w.LC_KAKAO_KEY); });
    }
    kakaoLoading.then(cb, function () {});
  }
  function bar() {
    var box = d.createElement('div');
    box.className = 'share-bar';
    box.innerHTML = '<p class="share-q">이 계산이 필요한 사람에게 보내 주세요</p>' +
      '<div class="share-btns">' +
      (w.navigator.share ? '<button type="button" data-share="native">공유하기</button>' : '') +
      (w.LC_KAKAO_KEY ? '<button type="button" data-share="kakao">카카오톡</button>' : '') +
      '<button type="button" data-share="copy">링크 복사</button></div>' +
      '<p class="share-toast" hidden></p>';
    var t = box.querySelector('.share-toast');
    box.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-share]');
      if (!b) return;
      var m = b.getAttribute('data-share'), url = buildShareUrl(canonical(), m, w.location.pathname);
      if (m === 'native') { w.navigator.share({ title: title(), text: text(), url: url }).catch(function () {}); }
      else if (m === 'kakao') { kakao(function () { w.Kakao.Share.sendScrap({ requestUrl: url }); }); }
      else { copy(url, function () { toast(t, '주소를 복사했어요'); }); }
    });
    return box;
  }
  function mount() {
    var out = d.getElementById('out') || d.querySelector('[data-lc-result]');
    var placed = false;
    function place() {
      if (placed || !out || out.hidden || !out.textContent.trim()) return;
      placed = true; out.parentNode.insertBefore(bar(), out.nextSibling);
    }
    if (out && w.MutationObserver) {
      new MutationObserver(place).observe(out, { attributes: true, attributeFilter: ['hidden'], childList: true, subtree: true });
      place();
    } else if (!out) {
      var f = d.querySelector('footer.site');
      if (f) { f.parentNode.insertBefore(bar(), f); }
    }
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', mount); else mount();
})(typeof window !== 'undefined' ? window : this);
