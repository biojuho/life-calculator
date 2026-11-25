/* 생활계산서 공유·재방문 (viral-20261125)
 * - 계산 결과(#out)가 보이면 바로 아래에 공유 바를 붙입니다.
 * - 공유 문구에는 기본으로 결과 숫자를 넣지 않습니다. 사용자가 '결과 숫자도 함께 보내기'를 켤 때만 결과 한 줄을 넣습니다.
 *   입력값(연봉·대출액 등)은 공유 주소에 넣지 않습니다.
 * - 공유 주소에는 utm_source=share, utm_medium=<매체>, utm_campaign=<계산기 이름>을 붙입니다.
 * - 결과 이미지 카드: 화면의 결과를 이 기기에서 PNG로 그립니다(서버 전송 없음).
 * - 카카오톡 버튼은 window.LC_KAKAO_KEY(카카오 디벨로퍼스 JavaScript 키)가 있을 때만 보입니다.
 * - 클릭은 data-share 속성으로 track.js가 'share' 이벤트로 셉니다. 저장·설치 버튼은 공유로 세지 않도록 .lc-keep 안에 둡니다.
 * - '이 기기에 입력값 기억'은 사용자가 켤 때만 localStorage에 저장하고, 끄면 지웁니다.
 */
(function (root) {
  var MEDIA = /^(native|kakao|copy|image|naver|band|threads|facebook)$/;
  var WHO = {
    home: '생활비 계산이 필요한 사람에게 보내 주세요',
    salary: '이직·연봉 협상 중인 친구에게 보내 주세요',
    loan: '대출 알아보는 가족에게 보내 주세요',
    severance: '퇴사를 앞둔 동료에게 보내 주세요',
    counter: '자소서 쓰는 친구에게 보내 주세요',
    area: '집 보러 다니는 가족에게 보내 주세요',
    moving: '이사를 앞둔 친구에게 보내 주세요',
    dday: '같이 기다리는 사람에게 보내 주세요',
    electricity: '전기요금 고지서 받은 가족에게 보내 주세요',
    vat: '사업하는 친구에게 보내 주세요',
    internet: '인터넷 약정이 끝나 가는 가족에게 보내 주세요',
    'internet-contract': '약정 만료일이 궁금한 가족에게 보내 주세요',
    rental: '렌탈 계약을 고민하는 친구에게 보내 주세요',
    'water-rental': '정수기를 바꾸려는 가족에게 보내 주세요',
    'car-lease': '차를 바꾸려는 친구에게 보내 주세요',
    tutoring: '학원비를 고민하는 학부모 친구에게 보내 주세요',
    demolition: '인테리어를 준비하는 지인에게 보내 주세요',
    'tire-rental': '겨울 운전을 준비하는 친구에게 보내 주세요',
    'salary-table': '연봉 협상 중인 친구에게 보내 주세요',
    pyeong: '집 보러 다니는 가족에게 보내 주세요'
  };
  function toolName(path) {
    var m = /\/(tools|salary-table|pyeong)\/([a-z0-9-]*)\/?/.exec(path || '');
    if (!m) return 'home';
    if (m[1] !== 'tools') return m[1] + (m[2] ? '-' + m[2] : '');
    return m[2] || 'home';
  }
  function whoFor(name) { return WHO[name] || WHO[String(name).split('-')[0] === 'salary' ? 'salary-table' : ''] || (/^pyeong/.test(name) ? WHO.pyeong : WHO.home); }
  function buildShareUrl(base, medium, path) {
    var u = String(base || '').split('#')[0].split('?')[0];
    var med = MEDIA.test(medium) ? medium : 'copy';
    return u + '?utm_source=share&utm_medium=' + med + '&utm_campaign=' + toolName(path || u);
  }
  function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  // 결과 한 줄: 결과 영역의 첫 설명(.sub) + 큰 숫자(.big). 없으면 빈 문자열.
  function resultLine(sub, big) {
    sub = clean(sub).slice(0, 40); big = clean(big).slice(0, 40);
    if (!big) return '';
    return (sub ? sub + ' ' : '') + big;
  }
  function shareText(title, line, withResult) {
    var t = clean(title).replace(/\s*[—|-]\s*생활계산서$/, '');
    return withResult && line ? t + ' 결과: ' + line + ' — 내 조건으로도 계산해 보세요' : t + ' — 2026년 기준으로 바로 계산해 보세요';
  }
  function intentUrl(kind, url, text) {
    var e = encodeURIComponent;
    if (kind === 'naver') return 'https://share.naver.com/web/shareView?url=' + e(url) + '&title=' + e(text);
    if (kind === 'band') return 'https://band.us/plugin/share?body=' + e(text + '\n' + url) + '&route=' + e('biojuho.github.io');
    if (kind === 'threads') return 'https://www.threads.net/intent/post?text=' + e(text + ' ' + url);
    if (kind === 'facebook') return 'https://www.facebook.com/sharer/sharer.php?u=' + e(url);
    return url;
  }
  // .ics 한 건(종일 일정). dateISO: YYYY-MM-DD
  function icsFor(dateISO, summary, url) {
    var d = String(dateISO).replace(/-/g, '');
    if (!/^\d{8}$/.test(d)) return '';
    var n = new Date(Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8) + 1));
    var d2 = n.getUTCFullYear() + ('0' + (n.getUTCMonth() + 1)).slice(-2) + ('0' + n.getUTCDate()).slice(-2);
    var esc = function (s) { return String(s).replace(/[\\;,]/g, function (c) { return '\\' + c; }).replace(/\n/g, '\\n'); };
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//life-calculator//KO', 'BEGIN:VEVENT',
      'UID:' + d + '-' + Math.abs(hash(summary)) + '@biojuho.github.io', 'DTSTAMP:' + d + 'T000000Z',
      'DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + d2, 'SUMMARY:' + esc(summary), 'DESCRIPTION:' + esc(url),
      'BEGIN:VALARM', 'TRIGGER:-P7D', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(summary), 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
  }
  function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function firstDate(text) {
    var m = /(20\d{2})[-.년]\s*(\d{1,2})[-.월]\s*(\d{1,2})/.exec(text || '');
    if (!m) return '';
    return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  }
  var api = { buildShareUrl: buildShareUrl, toolName: toolName, shareText: shareText, resultLine: resultLine, intentUrl: intentUrl, icsFor: icsFor, firstDate: firstDate, whoFor: whoFor };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  var w = root, d = w.document;
  if (!d || /(^|[?&])embed=1(&|$)/.test(w.location.search)) return; // 위젯(임베드) 화면에서는 숨김
  var NAME = toolName(w.location.pathname);
  function canonical() { var l = d.querySelector('link[rel="canonical"]'); return (l && l.href) || (w.location.origin + w.location.pathname); }
  function title() { var m = d.querySelector('meta[property="og:title"]'); return (m && m.content) || d.title; }
  function h1() { var h = d.querySelector('h1'); return clean(h ? h.textContent : title()); }
  function outEl() { return d.getElementById('out') || d.querySelector('[data-lc-result]'); }
  function currentLine() {
    var o = outEl(); if (!o) return '';
    var big = o.querySelector('.big'), sub = o.querySelector('.sub');
    return resultLine(sub && sub.textContent, big && big.textContent);
  }
  function toast(el, msg) { el.textContent = msg; el.hidden = false; clearTimeout(el._t); el._t = setTimeout(function () { el.hidden = true; }, 2600); }
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

  /* ---------- 결과 이미지 카드 (1080×1350, 이 기기에서만 그림) ---------- */
  function wrapLines(ctx, text, maxW, maxLines) {
    var out = [], line = '';
    for (var i = 0; i < text.length; i++) {
      var t = line + text[i];
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = text[i]; if (out.length === maxLines) break; }
      else line = t;
    }
    if (out.length < maxLines && line) out.push(line);
    return out;
  }
  function drawCard() {
    var o = outEl(); var c = d.createElement('canvas'); c.width = 1080; c.height = 1350;
    var x = c.getContext('2d'); if (!x) return null;
    var F = '"Pretendard","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
    x.fillStyle = '#f3efe6'; x.fillRect(0, 0, 1080, 1350);
    x.fillStyle = '#fffdf8'; x.fillRect(60, 60, 960, 1230);
    x.strokeStyle = '#d9d1c1'; x.lineWidth = 3; x.strokeRect(60, 60, 960, 1230);
    x.fillStyle = '#b8432f'; x.fillRect(110, 110, 92, 92);
    x.fillStyle = '#fff'; x.font = '700 56px ' + F; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('計', 156, 158);
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    x.fillStyle = '#1f1f1f'; x.font = '800 40px ' + F; x.fillText('생활계산서', 228, 152);
    x.fillStyle = '#6b6458'; x.font = '500 28px ' + F; x.fillText('2026년 기준 생활 계산기', 228, 192);
    x.fillStyle = '#1f1f1f'; x.font = '800 58px ' + F;
    var y = 330; wrapLines(x, h1(), 860, 2).forEach(function (l) { x.fillText(l, 110, y); y += 72; });
    var sub = o && o.querySelector('.sub'), big = o && o.querySelector('.big'), ver = o && o.querySelector('.verdict');
    y += 40;
    if (sub) { x.fillStyle = '#6b6458'; x.font = '600 36px ' + F; wrapLines(x, clean(sub.textContent), 860, 2).forEach(function (l) { x.fillText(l, 110, y); y += 50; }); }
    if (big) {
      var bt = clean(big.textContent), size = 120; x.font = '900 ' + size + 'px ' + F;
      while (x.measureText(bt).width > 860 && size > 48) { size -= 6; x.font = '900 ' + size + 'px ' + F; }
      y += size; x.fillStyle = '#1f6b4f'; x.fillText(bt, 110, y); y += 40;
    }
    if (ver) {
      y += 30; x.fillStyle = '#e6f0ea'; var lines = (x.font = '700 36px ' + F, wrapLines(x, clean(ver.textContent), 820, 4));
      x.fillRect(110, y, 860, lines.length * 52 + 40); x.fillStyle = '#1f6b4f'; y += 66;
      lines.forEach(function (l) { x.fillText(l, 132, y); y += 52; });
    }
    x.fillStyle = '#6b6458'; x.font = '500 28px ' + F;
    x.fillText('참고용 계산입니다. 실제 금액은 고지서·계약서가 우선합니다.', 110, 1150);
    x.fillStyle = '#1f1f1f'; x.font = '700 34px ' + F; x.fillText('biojuho.github.io/life-calculator', 110, 1210);
    return c;
  }
  function imageShare(t) {
    var c = drawCard(); if (!c || !c.toBlob) { toast(t, '이 브라우저에서는 이미지를 만들 수 없어요'); return; }
    c.toBlob(function (blob) {
      if (!blob) return;
      var fname = 'life-calculator-' + NAME + '.png';
      var file = null; try { file = new File([blob], fname, { type: 'image/png' }); } catch (e) {}
      if (file && w.navigator.canShare && w.navigator.canShare({ files: [file] })) {
        w.navigator.share({ files: [file], title: h1(), text: buildShareUrl(canonical(), 'image', w.location.pathname) }).catch(function () {});
      } else {
        var a = d.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fname; d.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
        toast(t, '결과 이미지를 저장했어요. 이미지에는 결과 숫자가 들어 있어요.');
      }
    }, 'image/png');
  }

  /* ---------- 공유 바 ---------- */
  var MORE = [['naver', '네이버 블로그·카페'], ['band', '밴드'], ['threads', '스레드'], ['facebook', '페이스북']];
  function bar() {
    var box = d.createElement('div');
    box.className = 'share-bar';
    box.innerHTML = '<p class="share-q">' + whoFor(NAME) + '</p>' +
      '<div class="share-btns">' +
      (w.navigator.share ? '<button type="button" data-share="native">공유하기</button>' : '') +
      (w.LC_KAKAO_KEY ? '<button type="button" data-share="kakao">카카오톡</button>' : '') +
      '<button type="button" data-share="copy">링크 복사</button>' +
      '<button type="button" data-share="image">결과 이미지</button></div>' +
      '<label class="share-opt"><input type="checkbox" data-share-opt="result"> 결과 숫자도 함께 보내기 <small>(기본은 계산기 주소만 보내요)</small></label>' +
      '<details class="share-more"><summary>다른 곳에 공유</summary><div class="share-btns">' +
      MORE.map(function (m) { return '<a data-share="' + m[0] + '" target="_blank" rel="noopener" href="#">' + m[1] + '</a>'; }).join('') +
      '<a class="share-embed" href="/life-calculator/partners/#blog">내 블로그에 계산기 넣기</a></div></details>' +
      '<p class="share-toast" role="status" hidden></p>';
    var t = box.querySelector('.share-toast'), opt = box.querySelector('[data-share-opt]');
    function text() { return shareText(title(), currentLine(), opt.checked); }
    function refresh() {
      [].forEach.call(box.querySelectorAll('a[data-share]'), function (a) {
        var k = a.getAttribute('data-share'); a.href = intentUrl(k, buildShareUrl(canonical(), k, w.location.pathname), text());
      });
    }
    refresh();
    opt.addEventListener('change', refresh);
    box.addEventListener('pointerdown', refresh, true);
    box.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-share]');
      if (!b) return;
      var m = b.getAttribute('data-share'), url = buildShareUrl(canonical(), m, w.location.pathname);
      if (m === 'native') { w.navigator.share({ title: title(), text: text(), url: url }).catch(function () {}); }
      else if (m === 'kakao') { kakao(function () { w.Kakao.Share.sendScrap({ requestUrl: url }); }); }
      else if (m === 'image') { imageShare(t); }
      else { copy(opt.checked ? text() + '\n' + url : url, function () { toast(t, opt.checked ? '결과 한 줄과 주소를 복사했어요' : '주소를 복사했어요'); }); }
    });
    return box;
  }

  /* ---------- 다시 쓰기: 입력 기억(옵트인)·홈 화면 추가·캘린더 ---------- */
  var KEY = 'lc_saved:' + NAME;
  function form() { return d.getElementById('f') || d.querySelector('main form'); }
  function fields(f) { return [].filter.call(f.querySelectorAll('input[id],select[id]'), function (el) { return !/^(checkbox|radio|hidden|file|password)$/.test(el.type); }); }
  function save() {
    var f = form(); if (!f) return;
    var v = {}; fields(f).forEach(function (el) { v[el.id] = String(el.value).slice(0, 40); });
    try { w.localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), v: v })); } catch (e) {}
  }
  function load() { try { return JSON.parse(w.localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function keepBox() {
    var k = d.createElement('div'); k.className = 'lc-keep';
    var f = form(), html = '';
    if (f && NAME !== 'counter') html += '<label class="keep-opt"><input type="checkbox" data-remember> 이 기기에 입력값 기억하기 <small>(서버로 보내지 않아요 · 끄면 지워요)</small></label>';
    if ((NAME === 'dday' || NAME === 'internet-contract') && firstDate(currentLine() || (outEl() || {}).textContent)) html += '<button type="button" data-lc-save="ics">캘린더에 날짜 저장(.ics)</button>';
    html += '<p class="lc-install">' + (w.__lcInstall ? '<button type="button" data-lc-save="install">홈 화면에 추가</button> ' : '') +
      '다음에 또 쓰려면 <strong>홈 화면에 추가</strong>해 두세요' + (/iPhone|iPad/.test(w.navigator.userAgent) ? ' (Safari 공유 버튼 → 홈 화면에 추가)' : ' (브라우저 메뉴 → 홈 화면에 추가)') + '.</p>';
    k.innerHTML = html;
    var r = k.querySelector('[data-remember]');
    if (r) {
      r.checked = !!load();
      r.addEventListener('change', function () { if (r.checked) save(); else { try { w.localStorage.removeItem(KEY); } catch (e) {} } });
      if (f) f.addEventListener('submit', function () { if (r.checked) save(); });
    }
    k.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-lc-save]'); if (!b) return;
      if (b.getAttribute('data-lc-save') === 'install' && w.__lcInstall) { w.__lcInstall.prompt(); w.__lcInstall = null; b.remove(); return; }
      var o = outEl(), date = firstDate(o && o.querySelector('.big') ? o.querySelector('.big').textContent : '') || firstDate(o && o.textContent);
      var ics = icsFor(date, h1() + ' — ' + date, canonical()); if (!ics) return;
      var a = d.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = NAME + '-' + date + '.ics';
      d.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    });
    return k;
  }
  function restoreOffer() {
    var s = load(), f = form(); if (!s || !f || !s.v) return;
    var p = d.createElement('p'); p.className = 'lc-restore';
    p.innerHTML = '<button type="button">지난 입력 불러오기</button> <small>이 기기에 저장된 값이에요</small>';
    p.querySelector('button').addEventListener('click', function () {
      Object.keys(s.v).forEach(function (id) { var el = d.getElementById(id); if (el && f.contains(el)) { el.value = s.v[id]; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } });
      p.remove(); if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event('submit', { cancelable: true }));
    });
    f.parentNode.insertBefore(p, f);
  }
  function welcome() {
    var q; try { q = new URLSearchParams(w.location.search); } catch (e) { return; }
    if (q.get('utm_source') !== 'share') return;
    var h = d.querySelector('main h1'); if (!h) return;
    var p = d.createElement('p'); p.className = 'share-welcome';
    var f = form();
    p.innerHTML = '공유받은 계산기예요. 내 조건을 넣고 계산 버튼을 누르면 바로 결과가 나와요.' + (f ? ' <a href="#' + (f.id || 'f') + '">입력하러 가기</a>' : '');
    var after = h.nextElementSibling && /desc|lead/.test(h.nextElementSibling.className) ? h.nextElementSibling : h;
    after.parentNode.insertBefore(p, after.nextSibling);
  }
  function manifest() {
    if (d.querySelector('link[rel="manifest"]')) return;
    var l = d.createElement('link'); l.rel = 'manifest'; l.href = '/life-calculator/manifest.webmanifest'; d.head.appendChild(l);
  }
  w.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); w.__lcInstall = e; });

  function mount() {
    manifest(); welcome(); restoreOffer();
    var out = outEl();
    var placed = false;
    function place() {
      if (placed || !out || out.hidden || !out.textContent.trim()) return;
      placed = true;
      var b = bar(); out.parentNode.insertBefore(b, out.nextSibling);
      b.parentNode.insertBefore(keepBox(), b.nextSibling);
    }
    if (out && w.MutationObserver) {
      new MutationObserver(function () {
        place();
        var k = d.querySelector('.lc-keep');
        if (k && (NAME === 'dday' || NAME === 'internet-contract') && !k.querySelector('[data-lc-save="ics"]') && firstDate(out.textContent)) { k.parentNode.replaceChild(keepBox(), k); }
      }).observe(out, { attributes: true, attributeFilter: ['hidden'], childList: true, subtree: true });
      place();
    } else if (!out) {
      var f = d.querySelector('footer.site');
      if (f) { f.parentNode.insertBefore(bar(), f); }
    }
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', mount); else mount();
})(typeof window !== 'undefined' ? window : this);
