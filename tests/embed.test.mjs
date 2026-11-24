import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { src, TOOLS } = require('../widget.js');

test('위젯: 허용된 계산기만 embed=1 주소로 만든다', () => {
  assert.equal(src('rental', 'abc-1'), 'https://biojuho.github.io/life-calculator/tools/rental/?embed=1&utm_source=widget&utm_medium=embed&utm_campaign=abc-1');
  assert.equal(src('../../evil', 'x'), null);
  assert.equal(src('javascript:alert(1)', 'x'), null);
});

test('위젯: 업체코드의 특수문자는 지운다', () => {
  assert.match(src('vat', '<script>"&'), /utm_campaign=script$/);
  assert.match(src('vat', ''), /utm_campaign=unknown$/);
});

test('모든 계산기 페이지가 embed-mode.js를 불러오고, 위젯 목록에 있다', () => {
  const dirs = readdirSync(new URL('../tools/', import.meta.url));
  for (const d of dirs) {
    const h = readFileSync(new URL(`../tools/${d}/index.html`, import.meta.url), 'utf8');
    assert.match(h, /js\/embed-mode\.js/, d);
    assert.ok(TOOLS.includes(d), d);
  }
});

test('embed 모드 CSS가 제휴 CTA와 머리말을 숨긴다', () => {
  const c = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
  assert.match(c, /html\.embed header\.site/);
  assert.match(c, /html\.embed[^{]*\.cta/);
});

test('업체 안내 페이지: noindex, 위젯 로더, 사업자 정보', () => {
  const h = readFileSync(new URL('../partners/index.html', import.meta.url), 'utf8');
  assert.match(h, /noindex/);
  assert.match(h, /widget\.js/);
  assert.match(h, /266-31-02086/);
  assert.doesNotMatch(h, /sens\.kr|dbdbdeep/);
});
