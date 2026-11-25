/* 정수기 렌탈 총비용
 * 총비용 = 월 렌탈료 × 의무사용기간(개월) + 등록비·설치비 + 지금 쓰는 정수기 계약의 남은 위약금
 * 입력값은 브라우저에서만 계산하며, 렌탈료·의무사용기간·설치 조건은 상담·계약서가 우선합니다.
 */
import { isSeoulWeekend } from './car-lease.mjs';

const n = (v) => Math.max(0, Number(v) || 0);

/** 대한민국 관공서 공휴일(대체공휴일 포함, 2026-11 이후). 주말은 isSeoulWeekend로 따로 봅니다. */
export const KR_HOLIDAYS = new Set([
  '2026-12-25',
  '2027-01-01',
  '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09',
  '2027-03-01',
  '2027-05-05',
  '2027-05-13',
  '2027-06-06',
  '2027-08-15', '2027-08-16',
  '2027-09-14', '2027-09-15', '2027-09-16',
  '2027-10-03', '2027-10-04', '2027-10-09', '2027-10-11',
  '2027-12-25',
]);

export function seoulYmd(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function isSeoulHoliday(now = new Date()) {
  return KR_HOLIDAYS.has(seoulYmd(now));
}

export function isCowayConsultOpen(now = new Date()) {
  return !isSeoulWeekend(now) && !isSeoulHoliday(now);
}

export function waterRentalTotal(o = {}) {
  const months = Math.round(n(o.months));
  if (!(months >= 1 && months <= 120)) throw new Error('의무 사용 기간은 1~120개월');
  const monthly = n(o.monthly);
  const setup = n(o.setupFee);
  const penalty = n(o.penalty);
  const base = monthly * months + setup;
  const totalNow = base + penalty;
  return {
    months,
    monthly,
    setup,
    penalty,
    remainingMonths: Math.round(n(o.remainingMonths)),
    base: Math.round(base),
    totalNow: Math.round(totalNow),
    totalLater: Math.round(base),
    monthlyAvg: Math.round(totalNow / months),
    penaltyHigh: penalty >= monthly && penalty > 0,
  };
}
