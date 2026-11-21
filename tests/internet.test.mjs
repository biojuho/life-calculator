import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { internetSwitch } from '../js/calc.mjs';
import { CTA } from '../js/cta-config.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('인터넷: 위약금 내고 지금 갈아타기 — 36개월 총액·절감액·회수 개월', () => {
  const r = internetSwitch({ currentMonthly: 38_500, remainingMonths: 8, penalty: 120_000,
    newMonthly: 27_500, newTermMonths: 36, benefit: 0, installFee: 36_000 });
  assert.equal(r.stayTotal, 1_386_000);        // 38,500 × 36
  assert.equal(r.switchNowTotal, 1_146_000);   // 27,500 × 36 + 120,000 + 36,000
  assert.equal(r.savingsNow, 240_000);
  assert.equal(r.monthlySavingsNow, 6_667);    // 240,000 / 36 반올림
  assert.equal(r.upfront, 156_000);
  assert.equal(r.paybackMonths, 15);           // ceil(156,000 / 11,000)
  assert.equal(r.waitTotal, 1_114_000);        // 38,500×8 + 27,500×28 + 36,000
  assert.equal(r.best, 'wait');
});

test('인터넷: 혜택이 위약금보다 크면 회수 0개월', () => {
  const r = internetSwitch({ currentMonthly: 30_000, penalty: 50_000, newMonthly: 30_000,
    newTermMonths: 24, benefit: 80_000 });
  assert.equal(r.upfront, -30_000);
  assert.equal(r.paybackMonths, 0);
  assert.equal(r.savingsNow, 30_000);
  assert.equal(r.best, 'now');
});

test('인터넷: 새 요금이 더 비싸고 위약금이 있으면 회수 불가, 유지가 최선', () => {
  const r = internetSwitch({ currentMonthly: 25_000, remainingMonths: 0, penalty: 60_000,
    newMonthly: 28_000, newTermMonths: 36 });
  assert.equal(r.paybackMonths, null);
  assert.equal(r.paybackWithinTerm, false);
  assert.ok(r.savingsNow < 0);
  assert.equal(r.best, 'stay');
});

test('인터넷: 음수·빈 입력은 0으로, 남은 약정은 비교 기간으로 자름', () => {
  const r = internetSwitch({ currentMonthly: -5, remainingMonths: 99, penalty: 'x',
    newMonthly: 20_000, newTermMonths: 12 });
  assert.equal(r.remainingMonths, 12);
  assert.equal(r.stayTotal, 0);
  assert.equal(r.switchNowTotal, 240_000);
});

test('CTA 설정: 제휴 링크는 아직 꺼져 있고 대가성 문구 자리가 있음', () => {
  assert.equal(CTA.internet.enabled, false);
  assert.equal(CTA.internet.url, '');
  assert.match(CTA.internet.disclosure, /제휴/);
  assert.match(CTA.internet.disclosure, /수수료/);
});

test('페이지: SEO 메타·canonical·모바일 viewport, 금지 문구 없음', () => {
  const html = read('tools/internet/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/biojuho\.github\.io\/life-calculator\/tools\/internet\/">/);
  assert.match(html, /<meta name="description" content="[^"]{40,}">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(html, /예시값/);
  for (const bad of ['사은품', '현금', '상품권', '최대 지원', '후기']) assert.ok(!html.includes(bad), bad);
  assert.ok(!/href="https?:\/\/(?!biojuho\.github\.io|cdn\.jsdelivr|fonts\.googleapis|schema\.org)/.test(html), '외부 링크 없음');
});

test('홈·sitemap·모든 페이지 메뉴에 인터넷 요금 링크', () => {
  assert.match(read('index.html'), /<a class="card" href="tools\/internet\/">/);
  assert.match(read('sitemap.xml'), /life-calculator\/tools\/internet\/<\/loc>/);
  const pages = ['index.html', '404.html', ...readdirSync(new URL('tools/', root)).map((d) => `tools/${d}/index.html`)];
  for (const p of pages) {
    const n = (read(p).match(/tools\/internet\/"/g) || []).length;
    assert.ok(n >= 2, `${p} nav+drawer`);
  }
});
