import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { takeHome } from '../js/calc.mjs';
const require = createRequire(import.meta.url);
const S = require('../js/share.js');
const BASE = 'https://biojuho.github.io/life-calculator/';
const rd = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('공유 문구: 기본은 결과 숫자를 넣지 않고, 켰을 때만 결과 한 줄을 넣는다', () => {
  const line = S.resultLine('월 실수령액', '3,512,340원');
  assert.equal(line, '월 실수령액 3,512,340원');
  assert.doesNotMatch(S.shareText('연봉 실수령액 — 생활계산서', line, false), /3,512,340/);
  assert.match(S.shareText('연봉 실수령액 — 생활계산서', line, true), /결과: 월 실수령액 3,512,340원/);
});

test('공유 주소: 새 매체도 UTM으로 구분하고, 모르는 값은 copy로 바꾼다', () => {
  for (const m of ['image', 'naver', 'band', 'threads', 'facebook'])
    assert.equal(S.buildShareUrl(BASE + 'tools/loan/?x=1', m), BASE + `tools/loan/?utm_source=share&utm_medium=${m}&utm_campaign=loan`);
  assert.equal(S.toolName('/life-calculator/salary-table/3000/'), 'salary-table-3000');
  assert.equal(S.toolName('/life-calculator/pyeong/84m2/'), 'pyeong-84m2');
});

test('인텐트 링크: 주소와 문구를 인코딩해 각 서비스 공유 주소로 만든다', () => {
  const u = BASE + 'tools/vat/?utm_source=share&utm_medium=naver&utm_campaign=vat';
  assert.ok(S.intentUrl('naver', u, '부가세').startsWith('https://share.naver.com/web/shareView?url=' + encodeURIComponent(u)));
  assert.ok(S.intentUrl('band', u, 'a').startsWith('https://band.us/plugin/share?body='));
  assert.ok(S.intentUrl('threads', u, 'a').startsWith('https://www.threads.net/intent/post?text='));
  assert.ok(S.intentUrl('facebook', u, 'a').startsWith('https://www.facebook.com/sharer/sharer.php?u='));
});

test('캘린더(.ics): 종일 일정과 7일 전 알림, 다음 날 종료', () => {
  const ics = S.icsFor('2026-12-31', '약정 만료', BASE);
  assert.match(ics, /DTSTART;VALUE=DATE:20261231/);
  assert.match(ics, /DTEND;VALUE=DATE:20270101/);
  assert.match(ics, /TRIGGER:-P7D/);
  assert.equal(S.icsFor('nope', 'x', BASE), '');
  assert.equal(S.firstDate('만료일 2027.3.5 입니다'), '2027-03-05');
});

test('share.js: 입력 기억은 옵트인(체크박스 기본 꺼짐), 결과 숫자 옵션도 기본 꺼짐', () => {
  const s = rd('js/share.js');
  assert.match(s, /<input type="checkbox" data-share-opt="result">/);
  assert.match(s, /<input type="checkbox" data-remember>/);
  assert.match(s, /r\.checked = !!load\(\)/);
  assert.doesNotMatch(s, /fetch\(|sendBeacon|XMLHttpRequest/); // 공유 스크립트는 네트워크로 아무것도 보내지 않음
});

const sal = readdirSync(new URL('../salary-table/', import.meta.url)).filter(d => /^\d+$/.test(d));
test('연봉별 페이지: 18개, 숫자가 계산 모듈과 같다', () => {
  assert.equal(sal.length, 18);
  for (const d of sal) {
    const h = rd(`salary-table/${d}/index.html`);
    const r = takeHome({ annual: Number(d) * 10000 });
    assert.ok(h.includes(`<p class="big">${r.netMonth.toLocaleString('en-US')}원</p>`), d);
    assert.match(h, /"@type":"FAQPage"/);
    assert.match(h, new RegExp(`tools/salary/\\?annual=${Number(d) * 10000}"`));
    assert.match(h, /<link rel="canonical" href="https:\/\/biojuho\.github\.io\/life-calculator\/salary-table\/\d+\/">/);
    assert.doesNotMatch(h, /sens\.kr/); // 키워드 페이지에는 제휴 링크 없음
  }
});

test('평수 페이지: 1평 = 400/121㎡로 환산', () => {
  const ds = readdirSync(new URL('../pyeong/', import.meta.url)).filter(d => /\d/.test(d));
  assert.equal(ds.length, 11);
  const h = rd('pyeong/84m2/index.html');
  assert.ok(h.includes('25.41평'));
  assert.ok(rd('pyeong/30py/index.html').includes('99.17㎡'));
});

test('sitemap: 새 페이지 32개 포함, 모두 실제 파일', () => {
  const sm = rd('sitemap.xml');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.equal(new Set(locs).size, locs.length);
  for (const u of locs) assert.ok(existsSync(new URL('../' + u.slice(BASE.length) + 'index.html', import.meta.url)), u);
  assert.ok(locs.filter(u => /salary-table|pyeong|updates/.test(u)).length >= 32);
});

test('manifest·개인정보처리방침·퍼가기 안내', () => {
  const m = JSON.parse(rd('manifest.webmanifest'));
  assert.equal(m.scope, '/life-calculator/');
  assert.match(rd('privacy/index.html'), /localStorage/);
  assert.match(rd('partners/index.html'), /id="blog"/);
  assert.match(rd('partners/index.html'), /출처 표기 예시/);
});
