/* 생활계산서 계산기 위젯 로더 (업체 사이트용)
 * 사용법: <div data-lc-tool="rental" data-lc-partner="업체코드"></div>
 *        <script src="https://biojuho.github.io/life-calculator/widget.js" async></script>
 * 허용된 계산기만 iframe으로 불러오고, 높이는 계산기 쪽에서 보내는 숫자로만 맞춥니다.
 */
(function () {
  'use strict';
  var BASE = 'https://biojuho.github.io/life-calculator/tools/';
  var TOOLS = ['salary', 'loan', 'severance', 'vat', 'electricity', 'area', 'moving', 'dday', 'internet', 'internet-contract', 'rental', 'water-rental', 'counter', 'car-lease', 'tutoring', 'demolition', 'tire-rental'];
  function src(tool, partner) {
    if (TOOLS.indexOf(tool) < 0) return null;
    var p = String(partner || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'unknown';
    return BASE + tool + '/?embed=1&utm_source=widget&utm_medium=embed&utm_campaign=' + p;
  }
  function mount(el) {
    if (el.getAttribute('data-lc-mounted')) return;
    var u = src(el.getAttribute('data-lc-tool'), el.getAttribute('data-lc-partner'));
    if (!u) return;
    var f = document.createElement('iframe');
    f.src = u;
    f.title = '생활계산서 계산기';
    f.loading = 'lazy';
    f.style.cssText = 'width:100%;border:0;min-height:420px;display:block';
    el.appendChild(f);
    el.setAttribute('data-lc-mounted', '1');
    window.addEventListener('message', function (e) {
      if (e.source !== f.contentWindow) return;
      if (e.origin !== 'https://biojuho.github.io') return;
      var d = e.data;
      if (d && d.type === 'lc-embed-height' && typeof d.height === 'number' && d.height > 100 && d.height < 6000) f.style.height = d.height + 'px';
    });
  }
  function run() { Array.prototype.forEach.call(document.querySelectorAll('[data-lc-tool]'), mount); }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { src: src, TOOLS: TOOLS }; return; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
