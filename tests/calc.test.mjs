import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  takeHome, incomeTaxWithholding, localIncomeTax, fourInsurance,
  electricityBill, vatFromSupply, vatFromTotal,
  pyeongToM2, m2ToPyeong, Pyeong,
  severancePay, calendarDays,
  loanEqualPayment, loanEqualPrincipal,
  dday, countText, todaySeoulISO,
} from '../js/calc.mjs';

test('간이세액표 2026: 월급 250만원 가족1 = 35,600원', () => {
  assert.equal(incomeTaxWithholding(2_500_000, 1), 35_600);
  assert.equal(localIncomeTax(35_600), 3_560);
});

test('연봉 3,000만원 본인만 비과세0 실수령 2,217,905원 (공개 예시와 일치)', () => {
  const r = takeHome({ annual: 30_000_000, dependents: 1, children8to20: 0 });
  assert.equal(r.monthly, 2_500_000);
  assert.equal(r.pension, 118_750);
  assert.equal(r.health, 89_875);
  assert.equal(r.ltc, 11_810);
  assert.equal(r.employment, 22_500);
  assert.equal(r.incomeTax, 35_600);
  assert.equal(r.local, 3_560);
  assert.equal(r.deduct, 282_095);
  assert.equal(r.netMonth, 2_217_905);
});

test('국민연금 상한 659만원 적용 (월급 1,000만원)', () => {
  const r = fourInsurance(10_000_000);
  assert.equal(r.npsBase, 6_590_000);
  assert.equal(r.pension, 313_025); // 6590000 * 0.0475 = 313025
});

test('8~20세 자녀 1명 세액공제 20,830원', () => {
  const a = incomeTaxWithholding(2_500_000, 2, 0);
  const b = incomeTaxWithholding(2_500_000, 2, 1);
  assert.equal(a - b, 20_830);
});

test('전기요금 기타계절 저압 450kWh 청구 108,050원 (한전 예시+기금 2.7%)', () => {
  const r = electricityBill({ kwh: 450, summer: false, fuel: 5.0, voltage: 'low' });
  assert.equal(r.base, 7300);
  assert.equal(r.energy, 82285);
  assert.equal(r.climate, 4050);
  assert.equal(r.fuel, 2250);
  assert.equal(r.subtotal, 95885);
  assert.equal(r.vat, 9589);
  assert.equal(r.fund, 2580);
  assert.equal(r.bill, 108050);
});

test('전기요금 기타계절 저압 200kWh 청구 31,220원', () => {
  const r = electricityBill({ kwh: 200, summer: false, fuel: 5.0 });
  assert.equal(r.bill, 31220);
});

test('전기요금 하계 350kWh는 1·2단계만 (기본요금 1,600)', () => {
  const s = electricityBill({ kwh: 350, summer: true, fuel: 5.0 });
  const n = electricityBill({ kwh: 350, summer: false, fuel: 5.0 });
  assert.equal(s.step, 2);
  assert.equal(s.base, 1600);
  assert.equal(n.step, 2);
  assert.ok(s.bill < n.bill);
});

test('부가세 공급가 100,000 → 합계 110,000 / 역산 일치', () => {
  const a = vatFromSupply(100000);
  assert.deepEqual(a, { supply: 100000, vat: 10000, total: 110000 });
  const b = vatFromTotal(110000);
  assert.deepEqual(b, { supply: 100000, vat: 10000, total: 110000 });
});

test('1평 = 400/121 ㎡', () => {
  assert.equal(Pyeong, 400 / 121);
  assert.ok(Math.abs(pyeongToM2(1) - 3.3057851239669) < 1e-12);
  assert.ok(Math.abs(m2ToPyeong(pyeongToM2(25)) - 25) < 1e-12);
});

test('퇴직금: 3개월 임금 900만, 90일, 재직 1095일', () => {
  const r = severancePay({ wage3monthTotal: 9_000_000, days3month: 90, serviceDays: 1095 });
  // 일 평균 100,000 * 30 * (1095/365) = 3,000,000 * 3 = 9,000,000
  assert.equal(r.avgDaily, 100000);
  assert.equal(Math.round(r.amount), 9_000_000);
});

test('재직 일수 달력 계산 2023-01-01~2026-01-01 = 1096일 (2024 윤년)', () => {
  assert.equal(calendarDays('2023-01-01', '2026-01-01'), 1096);
});

test('원리금균등 1억 연 3.5% 360회 월납 공식 일치', () => {
  const P = 100_000_000, n = 360, annual = 0.035;
  const r = annual / 12;
  const expected = (P * r * (1 + r) ** n) / ((1 + r) ** n - 1);
  const got = loanEqualPayment(P, annual, n);
  assert.ok(Math.abs(got.monthly - expected) < 1e-6);
  assert.ok(got.totalPay > P);
  assert.equal(got.schedule.length, 360);
  assert.ok(got.schedule[359].balance < 1);
});

test('원금균등 첫 달 이자가 마지막 달보다 큼', () => {
  const g = loanEqualPrincipal(100_000_000, 0.035, 360);
  assert.ok(g.monthlyFirst > g.monthlyLast);
  assert.equal(g.schedule.length, 360);
});

test('D-day 표기', () => {
  assert.deepEqual(dday('2026-11-16', '2026-11-16'), { days: 0, label: 'D-Day', direction: 0 });
  assert.equal(dday('2026-11-19', '2026-11-16').label, 'D-3');
  assert.equal(dday('2026-11-13', '2026-11-16').label, 'D+3');
});

test('글자수 한글 1자=1, UTF-8 한글 3바이트', () => {
  const r = countText('안녕 세상');
  assert.equal(r.chars, 5);
  assert.equal(r.noSpace, 4);
  assert.equal(r.bytesUtf8, 13); // 4*3 + 1 space
});

test('todaySeoulISO 형식', () => {
  assert.match(todaySeoulISO(), /^\d{4}-\d{2}-\d{2}$/);
});
