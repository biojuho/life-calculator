import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  m2ToPyeongRounded, daysUntil, isMoveDateEligible, compareQuotes, isIsabangCtaReady, PYEONG_M2,
} from '../js/moving.mjs';
import {
  waterRentalTotal, isCowayConsultOpen, isSeoulHoliday, seoulYmd,
} from '../js/water-rental.mjs';
import { isSeoulWeekend } from '../js/car-lease.mjs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('평수: 84㎡는 약 25.4평 (1평=400/121㎡)', () => {
  const py = m2ToPyeongRounded(84);
  assert.ok(Math.abs(py - 84 / (400 / 121)) < 1e-12);
  assert.equal(Math.round(py * 10) / 10, 25.4);
  assert.ok(Math.abs(PYEONG_M2 - 3.3058) < 1e-4);
});

test('이사일 60일 이내만 대상, 오늘 포함', () => {
  const now = new Date('2026-11-24T15:00:00Z'); // 2026-11-25 KST
  assert.equal(daysUntil('2026-11-25', now), 0);
  assert.equal(isMoveDateEligible('2026-11-25', now), true);
  assert.equal(isMoveDateEligible('2027-01-24', now), true);
  assert.equal(isMoveDateEligible('2027-01-25', now), false);
  assert.equal(isMoveDateEligible('2026-11-24', now), false);
});

test('견적 합산은 항목을 더할 뿐 시세를 만들지 않는다', () => {
  const r = compareQuotes([
    { base: 800000, ladder: 150000, ac: 200000, waste: 50000, elevator: 0, extra: 0 },
    { base: 900000 },
  ]);
  assert.equal(r.rows[0].total, 1200000);
  assert.equal(r.rows[1].total, 900000);
  assert.equal(r.min, 900000);
});

test('이사방 CTA는 60일 안 + 투룸 이상일 때만', () => {
  assert.equal(isIsabangCtaReady({ dateWithin60: true, isFamilyMove: true }), true);
  assert.equal(isIsabangCtaReady({ dateWithin60: true, isFamilyMove: false }), false);
  assert.equal(isIsabangCtaReady({ dateWithin60: false, isFamilyMove: true }), false);
});

test('정수기 총비용과 지금 vs 만료 후 비교', () => {
  const r = waterRentalTotal({ monthly: 19900, months: 36, setupFee: 0, penalty: 200000 });
  assert.equal(r.base, 716400);
  assert.equal(r.totalNow, 916400);
  assert.equal(r.totalLater, 716400);
  assert.equal(r.penaltyHigh, true);
});

test('코웨이 상담은 평일만, 공휴일 제외', () => {
  const wed = new Date('2026-11-24T15:00:00Z'); // 2026-11-25 수
  const sat = new Date('2026-11-27T15:00:00Z'); // 2026-11-28 토
  const xmas = new Date('2026-12-24T15:00:00Z'); // 2026-12-25 금
  assert.equal(isSeoulWeekend(wed), false);
  assert.equal(isSeoulWeekend(sat), true);
  assert.equal(isSeoulHoliday(xmas), true);
  assert.equal(seoulYmd(xmas), '2026-12-25');
  assert.equal(isCowayConsultOpen(wed), true);
  assert.equal(isCowayConsultOpen(sat), false);
  assert.equal(isCowayConsultOpen(xmas), false);
});

test('이사방 랜딩: CTA 활성, 디비센스 링크, 금지 표현 없음, 추적·공유', () => {
  const h = read('tools/moving/index.html') + read('js/moving.mjs');
  assert.match(h, /data-cta-enabled="true"/);
  assert.match(h, /href="https:\/\/u3suivhrep\.sens\.kr"/);
  assert.match(h, /data-campaign="dbsense_isabang_u3su"/);
  assert.match(h, /js\/track\.js/);
  assert.match(h, /js\/share\.js/);
  assert.match(h, /js\/embed-mode\.js/);
  assert.match(h, /광고 · 제휴/);
  assert.match(h, /제휴 수수료/);
  assert.match(h, /착한 비교견적/);
  assert.doesNotMatch(h, /최저가|최저 견적/);
  assert.doesNotMatch(h, /위매치|모두이사|짐싸/);
});

test('코웨이 랜딩: CTA 활성, 햇살대리점 상호만, 대표자·업체 사업자번호 없음', () => {
  const h = read('tools/water-rental/index.html') + read('js/water-rental.mjs');
  assert.match(h, /data-cta-enabled="true"/);
  assert.match(h, /href="https:\/\/y184iinoij\.sens\.kr"/);
  assert.match(h, /data-campaign="dbsense_coway_y184"/);
  assert.match(h, /햇살대리점/);
  assert.match(h, /쥬라프 \(사업자등록번호 266-31-02086\)/);
  assert.match(h, /신용불량자 및 미성년자는 신청이 불가합니다/);
  assert.match(h, /가상 예시이며 특정 제품 가격이 아닙니다/);
  assert.doesNotMatch(h, /대표자/);
  assert.doesNotMatch(h, /햇살대리점[^\n<]{0,80}사업자등록/);
  assert.doesNotMatch(h, /무료|공짜|지원금|렌탈지원금|현금지급|상품권|사은품|BTS/);
  assert.doesNotMatch(h, /스카이|청호|LG|쿠쿠|교원/);
});

test('홈·sitemap·위젯·평수 안내 박스에 두 계산기 연결, 미승인 CTA는 꺼진 채', () => {
  const home = read('index.html');
  const map = read('sitemap.xml');
  const widget = read('widget.js');
  for (const slug of ['moving', 'water-rental']) {
    assert.match(home, new RegExp(`href="tools/${slug}/"`));
    assert.match(map, new RegExp(`life-calculator/tools/${slug}/`));
    assert.match(widget, new RegExp(`'${slug}'`));
    assert.match(read(`tools/${slug}/index.html`), /aria-current="page"/);
  }
  assert.match(read('tools/area/index.html'), /tools\/moving\//);
  assert.doesNotMatch(read('tools/area/index.html'), /u3suivhrep\.sens\.kr/);
  const off = [
    ['car-lease', 'https://len3jodu6a.sens.kr'],
    ['tutoring', 'https://hhllsodpf3.sens.kr'],
    ['demolition', 'https://wd6qv2qmud.sens.kr'],
    ['tire-rental', 'https://hfb9veh8mj.sens.kr'],
  ];
  for (const [slug, url] of off) {
    const h = read(`tools/${slug}/index.html`);
    assert.match(h, /data-cta-enabled="false"/, slug);
    assert.match(h, /상담 연결 준비 중/, slug);
    assert.doesNotMatch(h, new RegExp(`href=["']${url.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`), slug);
  }
});
