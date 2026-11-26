import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { internetSwitch } from '../js/calc.mjs';
import { CTA, AFFILIATE_URL_PLACEHOLDER, isAffiliateUrlReady, isCtaLive } from '../js/cta-config.js';
import { buildInternetCtaHtml, buildDiagnosisHtml, drawShareCard, shareCardPayload, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from '../js/cta-internet.js';
import {
  diagnoseInternet, savingsBracketPoints, threeOptions, formatManwon, termLabelFor,
  buildShareSearch, parseShareSearch, buildShareUrl, MAX_CASH_BENEFIT_REF,
  RENEW_GIFT_NOTE, LOSS_LABEL, CTA_LABEL_READY, CTA_LABEL_WAIT,
} from '../js/internet-diagnosis.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const won = (n) => Math.round(Number(n) || 0).toLocaleString('ko-KR') + '원';

const defaultSwitch = () => internetSwitch({
  currentMonthly: 38_500, remainingMonths: 8, penalty: 120_000,
  newMonthly: 27_500, newTermMonths: 36, benefit: 0, installFee: 36_000,
});

test('인터넷: 위약금 내고 지금 갈아타기 — 36개월 총액·절감액·회수 개월', () => {
  const r = defaultSwitch();
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

test('CTA 설정: 디비센스 인터넷 비교원 필수 문구와 대가성 표시가 있음', () => {
  assert.equal(CTA.internet.campaign, '인터넷 비교원');
  assert.equal(CTA.internet.partner, '디비센스');
  assert.match(CTA.internet.headline, /인터넷 약정 끝나는 분\?/);
  assert.equal(CTA.internet.badge, '최대 48만원 + @ 현금 혜택');
  assert.equal(CTA.internet.benefit, '통신사 변경 시 최대 48만원 + @ 현금 혜택');
  assert.match(CTA.internet.badgeNote, /캠페인에 안내된 금액/);
  assert.match(CTA.internet.stayNote, /유지하면 혜택이 없/);
  assert.equal(CTA.internet.restriction, '연체·미성년자·신용불량자는 신청 불가');
  assert.equal(CTA.internet.disclosure, '이 버튼을 통한 상담 신청 시 운영자는 제휴 수수료를 제공받습니다.');
  assert.equal(CTA.internet.heroCaption, '이미지는 AI로 만든 예시입니다');
  assert.match(read('tools/internet/index.html'), /예시값/);
});

test('CTA: 사전검수 통과로 켜져 있고, enabled가 false이면 버튼은 꺼진다', () => {
  assert.equal(CTA.internet.url, 'https://l7nopd392j.sens.kr');
  assert.equal(CTA.internet.enabled, true);
  assert.equal(isAffiliateUrlReady(CTA.internet.url), true);
  assert.equal(isCtaLive(CTA.internet), true);
  assert.equal(isCtaLive({ ...CTA.internet, enabled: false }), false);
  assert.equal(isCtaLive({ ...CTA.internet, enabled: true }), true);
  assert.equal(isCtaLive({ ...CTA.internet, enabled: false, url: 'https://l7nopd392j.sens.kr' }), false);
  assert.equal(isCtaLive({ ...CTA.internet, enabled: true, url: AFFILIATE_URL_PLACEHOLDER }), false);
  assert.equal(isCtaLive({ url: 'https://l7nopd392j.sens.kr' }), false);
  assert.equal(isAffiliateUrlReady(''), false);
  assert.equal(isAffiliateUrlReady('   '), false);
  assert.equal(isAffiliateUrlReady('PLACEHOLDER'), false);
  assert.equal(isAffiliateUrlReady('placeholder'), false);
  assert.equal(isAffiliateUrlReady('  PLACEHOLDER  '), false);
  assert.equal(isAffiliateUrlReady('https://example.com/replace-me'), false);
  assert.equal(isAffiliateUrlReady('https://example.invalid/REPLACE_ME'), false);
  assert.equal(isAffiliateUrlReady('http://dbsense.kr/promo'), false);
  assert.equal(isAffiliateUrlReady('https://dbsense.kr/promo/abc'), true);
  const page = read('tools/internet/index.html');
  assert.match(page, /isCtaLive/);
  assert.ok(!page.includes('href="https://l7nopd392j.sens.kr"'), '페이지 HTML에 제휴 href를 하드코딩하지 않음');
  assert.ok(!page.includes('href="https://dbsense'), '페이지 HTML에 제휴 href를 하드코딩하지 않음');
});

test('진단 점수: 만료·절약 구간·위약금 감점 규칙이 고정돼 있다', () => {
  assert.equal(savingsBracketPoints(0), 0);
  assert.equal(savingsBracketPoints(50_000), 10);
  assert.equal(savingsBracketPoints(100_000), 20);
  assert.equal(savingsBracketPoints(199_999), 20);
  assert.equal(savingsBracketPoints(200_000), 30);
  assert.equal(savingsBracketPoints(399_999), 30);
  assert.equal(savingsBracketPoints(400_000), 40);
  assert.equal(MAX_CASH_BENEFIT_REF, 480_000);

  const expiredEqual = diagnoseInternet({ remainingMonths: 0, stayTotal: 100, switchNowTotal: 100, penalty: 0, term: 36 });
  assert.equal(expiredEqual.score, 40);
  assert.equal(expiredEqual.warnLoss, false);

  const example = diagnoseInternet({
    remainingMonths: 8, stayTotal: 1_386_000, switchNowTotal: 1_146_000,
    penalty: 120_000, term: 36, savingsNow: 240_000,
  });
  assert.equal(example.score, 30);
  assert.equal(example.warnLoss, false);
  assert.equal(example.lossLabel, '');
  assert.equal(example.headline, '나는 3년 기준 24만원 아낄 수 있음');
  assert.equal(example.ctaLabel, CTA_LABEL_READY);

  const expiredSave = diagnoseInternet({
    remainingMonths: 0, stayTotal: 1_386_000, switchNowTotal: 1_146_000,
    penalty: 0, term: 36, savingsNow: 240_000,
  });
  assert.equal(expiredSave.score, 70); // +40 만료 +30 절약

  const highPenalty = diagnoseInternet({
    remainingMonths: 0, stayTotal: 2_000_000, switchNowTotal: 1_500_000,
    penalty: 500_000, term: 36, savingsNow: 500_000,
  });
  assert.equal(highPenalty.score, 50); // +40 +40 -30

  const loss = diagnoseInternet({
    remainingMonths: 10, stayTotal: 900_000, switchNowTotal: 1_200_000,
    penalty: 200_000, term: 36, savingsNow: -300_000,
  });
  assert.equal(loss.score, 0);
  assert.equal(loss.warnLoss, true);
  assert.equal(loss.lossLabel, LOSS_LABEL);
  assert.equal(loss.headline, '약정이 10개월 남아 지금은 유지가 나음');
  assert.equal(loss.ctaLabel, CTA_LABEL_WAIT);
});

test('세 선택지: 유지 혜택 0원, 재약정은 모를 때 안내, 변경은 48만원을 총액에서 빼지 않음', () => {
  const r = defaultSwitch();
  const opts = threeOptions({
    currentMonthly: 38_500, newMonthly: 27_500, term: 36,
    penalty: 120_000, installFee: 36_000, benefit: 0,
  });
  assert.equal(opts.stay.total, r.stayTotal);
  assert.equal(opts.change.total, r.switchNowTotal);
  assert.equal(opts.stay.note, '유지하면 혜택 0원');
  assert.equal(opts.renew.total, r.stayTotal);
  assert.equal(opts.renew.giftKnown, false);
  assert.equal(opts.renew.note, RENEW_GIFT_NOTE);
  assert.equal(opts.stay.isBest, false);
  assert.equal(opts.renew.isBest, false);
  assert.equal(opts.change.isBest, true);
  assert.match(opts.change.note, /통신사 변경 시 최대 48만원 \+ @ 현금 혜택/);
  assert.match(opts.change.note, /상담에서 확정/);
  assert.match(opts.change.note, /유지 시 혜택 없음/);

  const withGift = threeOptions({
    currentMonthly: 38_500, newMonthly: 27_500, term: 36,
    penalty: 120_000, installFee: 36_000, benefit: 0,
    renewMonthly: 38_500, renewGift: 100_000, renewGiftKnown: true,
  });
  assert.equal(withGift.renew.total, 1_286_000);
  assert.equal(withGift.renew.giftKnown, true);
  assert.equal(withGift.renew.note, null);
  assert.equal(withGift.change.total, 1_146_000);
});

test('공유 링크: 입력값을 쿼리로 복원하고 서버에 보내지 않는다', () => {
  const inputs = {
    currentMonthly: 38_500, remainingMonths: 8, penalty: 120_000,
    newMonthly: 27_500, newTermMonths: 36, benefit: 0, installFee: 36_000,
  };
  const q = buildShareSearch(inputs);
  const parsed = parseShareSearch('?' + q);
  assert.deepEqual(parsed, inputs);
  assert.equal(parsed.renewGiftKnown, undefined);
  assert.ok(!('renewMonthly' in parsed));
  const url = buildShareUrl('https://biojuho.github.io/life-calculator/tools/internet/', inputs);
  assert.match(url, /^https:\/\/biojuho\.github\.io\/life-calculator\/tools\/internet\/\?/);
  assert.match(url, /cur=38500/);
  assert.equal(parseShareSearch(''), null);
  assert.equal(parseShareSearch('utm=1'), null);

  const withRenew = buildShareSearch({ ...inputs, renewMonthly: 30_000, renewGift: 100_000, renewGiftKnown: true });
  const p2 = parseShareSearch(withRenew);
  assert.equal(p2.renewMonthly, 30_000);
  assert.equal(p2.renewGift, 100_000);
  assert.equal(p2.renewGiftKnown, true);

  const termZero = parseShareSearch('cur=10000&nw=8000&term=0');
  assert.equal(termZero.newTermMonths, 0);
});

test('만원·기간 표기', () => {
  assert.equal(formatManwon(240_000), '24만원');
  assert.equal(formatManwon(5_000), '5,000원');
  assert.equal(termLabelFor(36), '3년');
  assert.equal(termLabelFor(24), '2년');
  assert.equal(termLabelFor(12), '1년');
  assert.equal(termLabelFor(18), '18개월');
});

test('CTA·진단 HTML: 계산 숫자와 필수 문구, enabled가 꺼지면 버튼도 꺼진다', () => {
  const r = defaultSwitch();
  const opts = threeOptions({
    currentMonthly: 38_500, newMonthly: 27_500, term: 36,
    penalty: 120_000, installFee: 36_000, benefit: 0,
  });
  const diagnosis = diagnoseInternet({
    remainingMonths: 8, stayTotal: r.stayTotal, switchNowTotal: r.switchNowTotal,
    penalty: 120_000, term: 36, savingsNow: r.savingsNow,
  });
  const diag = buildDiagnosisHtml({
    diagnosis, options: opts, term: r.term, won,
    shareUrl: 'https://biojuho.github.io/life-calculator/tools/internet/?cur=38500',
  });
  assert.match(diag, /나는 3년 기준 24만원 아낄 수 있음/);
  assert.match(diag, /지금 통신사 유지/);
  assert.match(diag, /지금 통신사 재약정/);
  assert.match(diag, /통신사 변경 상담/);
  assert.match(diag, /1,386,000원/);
  assert.match(diag, /1,146,000원/);
  assert.match(diag, /유지하면 혜택 0원/);
  assert.match(diag, /보통 상품권 십만원대/);
  assert.match(diag, /이미지 저장/);
  assert.match(diag, /링크 복사/);
  assert.match(diag, /공유하기/);
  assert.doesNotMatch(diag, /SKT|KT|LG U\+|LGU/);
  assert.doesNotMatch(diag, /당일입금|비밀지원금|선착순/);

  const html = buildInternetCtaHtml({
    cta: { ...CTA.internet, enabled: false }, live: isCtaLive({ ...CTA.internet, enabled: false }), diagnosis, won,
  });
  assert.match(html, /약정 끝난 분 대상/);
  assert.match(html, /최대 48만원 \+ @ 현금 혜택/);
  assert.match(html, /통신사 변경 시 최대 48만원 \+ @ 현금 혜택/);
  assert.match(html, /인터넷 약정 끝나는 분\?/);
  assert.match(html, /지금 쓰는 통신사를 그대로 유지하면 혜택이 없습니다/);
  assert.match(html, /연체·미성년자·신용불량자는 신청 불가/);
  assert.match(html, /이 버튼을 통한 상담 신청 시 운영자는 제휴 수수료를 제공받습니다/);
  assert.match(html, /상담만 요청, 가입은 나중에/);
  assert.match(html, /계산/);
  assert.match(html, /무료 상담 신청/);
  assert.match(html, /혜택 안내 전화/);
  assert.match(html, /src="assets\/cta-hero.svg"/);
  assert.match(html, /이미지는 AI로 만든 예시입니다/);
  assert.match(html, /aria-disabled="true"/);
  assert.match(html, /준비 중/);
  assert.ok(!html.includes('href="https://'), 'enabled가 꺼져 있으면 제휴 href 없음');
  assert.doesNotMatch(html, /SKT|KT|LG U\+|LGU/);
  assert.doesNotMatch(html, /당일입금|비밀지원금|선착순|70만|100만|128만/);

  const live = buildInternetCtaHtml({
    cta: { ...CTA.internet, enabled: true, url: 'https://l7nopd392j.sens.kr' },
    live: true, diagnosis, won,
  });
  assert.match(live, /href="https:\/\/l7nopd392j\.sens\.kr"/);
  assert.match(live, /target="_blank" rel="sponsored noopener"/);
  assert.match(live, /광고 · 제휴 링크/);
  assert.match(live, /이미지는 AI로 만든 예시입니다/);
  assert.match(live, /상담 받고 절약액 확인하기/);
  assert.ok(!live.includes('38,500원') && !live.includes('준비 중'), '라이브 버튼은 상담 문구, 준비 중 아님');

  const waitHtml = buildInternetCtaHtml({
    cta: { ...CTA.internet, enabled: true },
    live: true,
    diagnosis: diagnoseInternet({
      remainingMonths: 10, stayTotal: 900_000, switchNowTotal: 1_200_000,
      penalty: 200_000, term: 36, savingsNow: -300_000,
    }),
    won,
  });
  assert.match(waitHtml, /만료 달력만 받아 두기/);
  assert.match(waitHtml, /지금은 위약금 때문에 손해볼 수 있어요/);
});

test('공유 카드: 사용자 계산 헤드라인과 막대 값을 그린다', () => {
  const r = defaultSwitch();
  const opts = threeOptions({
    currentMonthly: 38_500, newMonthly: 27_500, term: 36,
    penalty: 120_000, installFee: 36_000, benefit: 0,
  });
  const diagnosis = diagnoseInternet({
    remainingMonths: 8, stayTotal: r.stayTotal, switchNowTotal: r.switchNowTotal,
    penalty: 120_000, term: 36, savingsNow: r.savingsNow,
  });
  const payload = shareCardPayload({
    diagnosis, options: opts,
    shareUrl: 'https://biojuho.github.io/life-calculator/tools/internet/?cur=38500',
  });
  assert.equal(payload.title, '인터넷 요금 진단');
  assert.equal(payload.headline, '나는 3년 기준 24만원 아낄 수 있음');
  assert.equal(payload.stayTotal, 1_386_000);
  assert.equal(payload.changeTotal, 1_146_000);
  assert.equal(payload.stayNote, '유지하면 혜택 0원');
  assert.match(payload.fine, /입력값 기준 참고치/);
  assert.equal(payload.source, '생활계산서 인터넷 요금 비교');
  assert.equal(payload.url, 'biojuho.github.io/life-calculator/tools/internet/');
  assert.doesNotMatch(payload.headline + payload.fine, /당일입금|비밀지원금/);

  const texts = [];
  const ctx = {
    fillStyle: '', strokeStyle: '', font: '', textAlign: '', textBaseline: '', lineWidth: 0,
    fillRect() {}, strokeRect() {}, beginPath() {}, arc() {}, fill() {}, stroke() {},
    roundRect() {}, fillText(t) { texts.push(String(t)); },
    measureText(t) { return { width: String(t).length * 12 }; },
  };
  drawShareCard(ctx, payload, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
  assert.ok(texts.includes('인터넷 요금 진단'));
  assert.ok(texts.some((t) => t.includes('24만원')));
  assert.ok(texts.includes('유지하면 혜택 0원'));
  assert.ok(texts.includes('1,386,000원'));
  assert.ok(texts.includes('1,146,000원'));
  assert.ok(texts.includes('생활계산서 인터넷 요금 비교'));
  assert.ok(!texts.some((t) => /SKT|KT|당일입금|비밀지원금/.test(t)));
});

test('페이지: CTA 모듈을 쓰고 히어로 이미지 자리와 AI 예시 표시가 있음', () => {
  const page = read('tools/internet/index.html');
  assert.match(page, /buildInternetCtaHtml/);
  assert.match(page, /buildDiagnosisHtml/);
  assert.match(page, /bindCtaHero/);
  assert.match(page, /bindShareActions/);
  const mod = read('js/cta-internet.js');
  assert.match(mod, /assets\/cta-hero\.svg/);
  assert.match(mod, /이미지는 AI로 만든 예시입니다/);
  assert.match(mod, /bindCtaHero/);
});

test('페이지: SEO 메타·canonical·모바일 viewport, 금지 문구 없음', () => {
  const html = read('tools/internet/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/biojuho\.github\.io\/life-calculator\/tools\/internet\/">/);
  assert.match(html, /<meta name="description" content="[^"]{40,}">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(html, /예시값/);
  for (const bad of ['사은품', '현금', '상품권', '최대 지원', '후기']) assert.ok(!html.includes(bad), bad);
  // 외부 링크는 공식 출처(정부·공공·통신사 공식 사이트)만 허용 (2026-11-25 승인)
  const official = ['www.smartchoice.or.kr', 'www.ccn.go.kr', 'www.kca.go.kr', 'www.kt.com', 'www.skbroadband.com', 'www.lguplus.com'];
  const allowed = /^(biojuho\.github\.io|cdn\.jsdelivr\.net|fonts\.googleapis\.com|schema\.org)$/;
  for (const [, host] of html.matchAll(/href="https?:\/\/([^/"]+)/g)) {
    assert.ok(allowed.test(host) || official.includes(host), `허용되지 않은 외부 링크: ${host}`);
  }
  for (const [tag] of html.matchAll(/<a [^>]*href="https:\/\/(?:www\.)?(?:smartchoice|ccn|kca|kt|skbroadband|lguplus)\.[^"]*"[^>]*>/g)) {
    assert.match(tag, /rel="noopener"/, '공식 출처 링크는 rel=noopener');
    assert.ok(!/sponsored/.test(tag), '공식 출처 링크는 제휴 링크가 아님');
  }
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
