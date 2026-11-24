import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { carLeaseCompare, isCarLeaseEligible, isSeoulWeekend } from '../js/car-lease.mjs';
import { tutoringCost, isTutoringEligible, WEEKS_PER_MONTH } from '../js/tutoring.mjs';
import { demolitionEstimate, isDemolitionEligible } from '../js/demolition.mjs';
import { tireRentalCompare, isTireRentalEligible } from '../js/tire-rental.mjs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

const PAGES = [
  { slug: 'car-lease', promo: 'https://len3jodu6a.sens.kr', campaign: 'dbsense_chadream_len3' },
  { slug: 'tutoring', promo: 'https://hhllsodpf3.sens.kr', campaign: 'dbsense_ivyedu_hhll' },
  { slug: 'demolition', promo: 'https://wd6qv2qmud.sens.kr', campaign: 'dbsense_muchon_wd6q' },
  { slug: 'tire-rental', promo: 'https://hfb9veh8mj.sens.kr', campaign: 'dbsense_nexen_winter_hfb9' },
];

test('장기렌트: 이자 0%일 때 할부 총액은 차량가, 렌트는 월 납입×기간', () => {
  const r = carLeaseCompare({ leaseMonthly: 450000, months: 36, price: 30000000, annualRatePct: 0 });
  assert.equal(r.lease, 16200000);
  assert.equal(r.installment, 30000000);
  assert.equal(r.diff, -13800000);
});

test('장기렌트: 대상은 21~69세 평일만', () => {
  const tue = new Date('2026-11-23T15:00:00Z'); // 2026-11-24 화요일 (Asia/Seoul)
  const sat = new Date('2026-11-27T15:00:00Z'); // 2026-11-28 토요일
  assert.equal(isSeoulWeekend(tue), false);
  assert.equal(isSeoulWeekend(sat), true);
  assert.equal(isCarLeaseEligible({ age: 21, now: tue }), true);
  assert.equal(isCarLeaseEligible({ age: 69, now: tue }), true);
  assert.equal(isCarLeaseEligible({ age: 20, now: tue }), false);
  assert.equal(isCarLeaseEligible({ age: 70, now: tue }), false);
  assert.equal(isCarLeaseEligible({ age: 35, now: sat }), false);
});

test('학원·과외: 3개월 총액과 대상 학년·지역', () => {
  const r = tutoringCost({ months: 3, academyMonthly: 350000, academyMaterials: 50000, tutorPerSession: 40000, sessionsPerWeek: 2 });
  assert.equal(r.academy, 1100000);
  assert.equal(r.tutor, Math.round(40000 * 2 * WEEKS_PER_MONTH * 3));
  assert.equal(isTutoringEligible({ grade: '중1', region: '서울' }), true);
  assert.equal(isTutoringEligible({ grade: '고2', region: '김해' }), true);
  assert.equal(isTutoringEligible({ grade: '고3', region: '서울' }), false);
  assert.equal(isTutoringEligible({ grade: '중2', region: '대전' }), false);
});

test('철거 가늠: 평수×단가와 ±20%, 20세 이상', () => {
  const r = demolitionEstimate({ pyeong: 24, unitCost: 150000 });
  assert.equal(r.mid, 3600000);
  assert.equal(r.low, 2880000);
  assert.equal(r.high, 4320000);
  assert.equal(isDemolitionEligible({ age: 20 }), true);
  assert.equal(isDemolitionEligible({ age: 19 }), false);
});

test('윈터타이어: 제휴카드 사용시에만 할인, 30~65세', () => {
  const off = tireRentalCompare({ monthly: 20000, months: 36, cardDiscount: 5000, usePartnerCard: false });
  const on = tireRentalCompare({ monthly: 20000, months: 36, cardDiscount: 5000, usePartnerCard: true });
  assert.equal(off.total, 720000);
  assert.equal(off.cardApplied, false);
  assert.equal(on.total, 540000);
  assert.equal(on.cardApplied, true);
  assert.equal(isTireRentalEligible({ age: 30 }), true);
  assert.equal(isTireRentalEligible({ age: 65 }), true);
  assert.equal(isTireRentalEligible({ age: 29 }), false);
  assert.equal(isTireRentalEligible({ age: 66 }), false);
});

test('네 랜딩: 추적 스크립트, CTA 비활성, 홍보 URL은 속성에만, 광고·수수료 표시', () => {
  for (const p of PAGES) {
    const h = read(`tools/${p.slug}/index.html`);
    assert.match(h, /js\/track\.js/, p.slug);
    assert.match(h, /js\/embed-mode\.js/, p.slug);
    assert.match(h, /상담 연결 준비 중/, p.slug);
    assert.match(h, /disabled/, p.slug);
    assert.match(h, /data-cta-enabled="false"/, p.slug);
    assert.match(h, new RegExp(`data-promo-url="${p.promo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), p.slug);
    assert.match(h, new RegExp(`data-campaign="${p.campaign}"`), p.slug);
    assert.doesNotMatch(h, /href=["'][^"']*sens\.kr/, p.slug);
    assert.match(h, /광고 · 제휴/, p.slug);
    assert.match(h, /제휴 수수료/, p.slug);
  }
});

test('윈터타이어 페이지에 금지 문구 없음, 제휴카드 사용시·렌탈불가 차량 고지', () => {
  const h = read('tools/tire-rental/index.html') + read('js/tire-rental.mjs');
  for (const w of ['인치/사이즈 관계없이', '렌탈료무료', '선착순', '출장교체', '출장서비스']) {
    assert.equal(h.includes(w), false, w);
  }
  assert.match(h, /렌탈불가 차량/);
  assert.match(h, /제휴카드 사용시/);
});

test('철거 페이지·모듈에 금지된 지원 금액 문구 없음', () => {
  const h = read('tools/demolition/index.html') + read('js/demolition.mjs');
  assert.doesNotMatch(h, /200\s*만/);
  assert.match(h, /현장 확인 후 확정/);
});

test('홈·sitemap·메뉴에 네 계산기 링크', () => {
  const home = read('index.html');
  const map = read('sitemap.xml');
  for (const p of PAGES) {
    assert.match(home, new RegExp(`href="tools/${p.slug}/"`));
    assert.match(map, new RegExp(`life-calculator/tools/${p.slug}/`));
    assert.match(read(`tools/${p.slug}/index.html`), new RegExp(`aria-current="page"`));
  }
  assert.match(read('widget.js'), /car-lease/);
});
