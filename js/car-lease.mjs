/* 장기렌트 vs 할부 총비용 비교
 * 렌트 총비용 = 월 납입×기간 + 선수금 + 만기 인수·반납 비용 + 기타 + 보험(선택)
 * 할부 총비용 = 선수금 + 원리금균등 총상환 + 기타 + 보험(선택)
 * 연이율은 연 %로 넣습니다(예: 4.5). 입력값은 브라우저에서만 계산하며, 실제 조건은 상담·계약서가 우선합니다.
 */
import { loanEqualPayment } from './calc.mjs';

const n = (v) => Math.max(0, Number(v) || 0);

export function isSeoulWeekend(now = new Date()) {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', weekday: 'short' }).format(now);
  return wd === 'Sat' || wd === 'Sun';
}

export function isCarLeaseEligible({ age, now = new Date() } = {}) {
  const a = Number(age);
  if (!Number.isFinite(a) || a < 21 || a > 69) return false;
  return !isSeoulWeekend(now);
}

export function carLeaseCompare(o = {}) {
  const months = Math.round(n(o.months));
  if (!(months >= 1 && months <= 120)) throw new Error('기간은 1~120개월');
  const insurance = n(o.insuranceMonthly) * months;
  const lease = n(o.leaseMonthly) * months + n(o.leaseDown) + n(o.residual) + n(o.leaseExtra) + insurance;
  const hasInst = n(o.price) > 0;
  let installment = null, installmentMonthly = null, installmentInterest = null, diff = null;
  if (hasInst) {
    const principal = Math.max(0, n(o.price) - n(o.installmentDown));
    const rate = n(o.annualRatePct) / 100;
    const loan = loanEqualPayment(principal, rate, months);
    installment = n(o.installmentDown) + loan.totalPay + n(o.installmentExtra) + insurance;
    installmentMonthly = loan.monthly;
    installmentInterest = loan.totalInterest;
    diff = lease - installment;
  }
  return {
    months,
    lease: Math.round(lease),
    leaseMonthlyAvg: Math.round(lease / months),
    installment: hasInst ? Math.round(installment) : null,
    installmentMonthly: hasInst ? Math.round(installmentMonthly) : null,
    installmentInterest: hasInst ? Math.round(installmentInterest) : null,
    diff: hasInst ? Math.round(diff) : null,
  };
}
