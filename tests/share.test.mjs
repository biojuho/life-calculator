import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { buildShareUrl, toolName } = require('../js/share.js');
const BASE = 'https://biojuho.github.io/life-calculator/';

test('공유 주소: 쿼리·해시를 지우고 share UTM을 붙인다', () => {
  assert.equal(buildShareUrl(BASE + 'tools/salary/?a=1#x', 'kakao'),
    BASE + 'tools/salary/?utm_source=share&utm_medium=kakao&utm_campaign=salary');
  assert.equal(buildShareUrl(BASE, 'evil'), BASE + '?utm_source=share&utm_medium=copy&utm_campaign=home');
  assert.equal(toolName('/life-calculator/tools/tire-rental/'), 'tire-rental');
});

const pages = ['index.html', ...readdirSync(new URL('../tools/', import.meta.url)).map(d => `tools/${d}/index.html`)];
for (const p of pages) {
  test(`${p}: 큰 미리보기 OG 이미지와 공유 스크립트`, () => {
    const h = readFileSync(new URL('../' + p, import.meta.url), 'utf8');
    const m = h.match(/<meta property="og:image" content="([^"]+)">/);
    assert.ok(m, 'og:image 없음');
    assert.ok(m[1].startsWith(BASE + 'assets/og/'), m[1]);
    assert.ok(existsSync(new URL('../' + m[1].slice(BASE.length), import.meta.url)), '이미지 파일 없음');
    assert.match(h, /og:image:width" content="1200"/);
    assert.match(h, /twitter:card" content="summary_large_image"/);
    assert.match(h, /js\/share\.js/);
  });
}
