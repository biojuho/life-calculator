import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rentalCompare } from '../js/rental.mjs';

test('렌탈 월 29,900원×60개월, 카드할인 월 10,000원×60개월 → 1,194,000원', () => {
  const r = rentalCompare({ monthly: 29900, months: 60, cardDiscount: 10000, cardMonths: 60 });
  assert.equal(r.rental, 1194000);
  assert.equal(r.rentalMonthly, 19900);
  assert.equal(r.buy, null);
});

test('구매가 600,000원 + 관리비 월 5,000원과 비교: 차액과 역전 개월', () => {
  const r = rentalCompare({ monthly: 29900, months: 60, setupFee: 0, buyPrice: 600000, buyCare: 5000 });
  assert.equal(r.rental, 1794000);
  assert.equal(r.buy, 900000);
  assert.equal(r.diff, 894000);
  assert.equal(r.breakEven, 25); // 29,900m ≥ 600,000 + 5,000m → m ≥ 24.1
});

test('잘못된 기간은 오류', () => {
  assert.throws(() => rentalCompare({ monthly: 1, months: 0 }));
});

test('렌탈 페이지: 통계 스크립트, 제휴 링크 없음, 혜택 조건 안내', () => {
  const h = readFileSync(new URL('../tools/rental/index.html', import.meta.url), 'utf8');
  assert.match(h, /js\/track\.js/);
  assert.doesNotMatch(h, /sens\.kr|dbdbdeep|link\.php/);
  assert.match(h, /계약서/);
});
