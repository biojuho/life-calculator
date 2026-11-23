import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addMonthsISO, contractStatus } from '../js/contract.mjs';

test('개월 더하기: 말일 보정', () => {
  assert.equal(addMonthsISO('2024-01-31', 1), '2024-02-29');
  assert.equal(addMonthsISO('2025-01-31', 1), '2025-02-28');
  assert.equal(addMonthsISO('2023-12-15', 36), '2026-12-15');
});

test('3년 약정 2023-12-15 가입 → 만료 2026-12-14, 오늘 2026-11-23이면 21일 남음(곧 만료)', () => {
  const r = contractStatus({ start: '2023-12-15', months: 36, today: '2026-11-23' });
  assert.equal(r.end, '2026-12-14');
  assert.equal(r.daysLeft, 21);
  assert.equal(r.stage, 'soon');
});

test('이미 만료: 2022-05-01 가입 3년 → 2025-04-30 만료, 월차액 11,000원 × 경과 개월', () => {
  const r = contractStatus({ start: '2022-05-01', months: 36, today: '2026-11-23', monthlyNow: 38500, monthlyNew: 27500 });
  assert.equal(r.end, '2025-04-30');
  assert.equal(r.stage, 'expired');
  assert.equal(r.monthlyGap, 11000);
  assert.equal(r.expiredMonths, 18);
  assert.equal(r.paidExtraEstimate, 198000);
});

test('약정 진행 중, 차액 입력 없으면 null', () => {
  const r = contractStatus({ start: '2026-01-10', months: 24, today: '2026-11-23' });
  assert.equal(r.end, '2028-01-09');
  assert.equal(r.stage, 'running');
  assert.equal(r.monthlyGap, null);
  assert.ok(r.pct > 0 && r.pct < 100);
});

test('잘못된 입력은 오류', () => {
  assert.throws(() => contractStatus({ start: '2026-02-30', months: 24, today: '2026-11-23' }));
  assert.throws(() => contractStatus({ start: '2026-01-01', months: 0, today: '2026-11-23' }));
});

import { readFileSync } from 'node:fs';
test('약정 만료일 페이지: 대가성 안내·캠페인 표시·내부 링크·통계 스크립트', () => {
  const h = readFileSync(new URL('../tools/internet-contract/index.html', import.meta.url), 'utf8');
  assert.match(h, /제휴 수수료를 받을 수 있습니다/);
  assert.match(h, /data-campaign="internal_internet_contract"/);
  assert.match(h, /href="\.\.\/internet\/\?utm_source=lc&amp;utm_medium=internal&amp;utm_campaign=internet_contract"/);
  assert.match(h, /js\/track\.js/);
  assert.doesNotMatch(h, /sens\.kr/); // 제휴 URL은 승인된 인터넷 페이지에만
});
