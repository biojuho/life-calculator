/* 윈터타이어 렌탈 기간 총비용
 * 총비용 = 월 렌탈료×기간 + 등록·장착비 − (제휴카드 사용시 월 할인×할인 개월)
 * 카드 할인은 usePartnerCard가 true일 때만 빼며, 예시 금액은 가상 값입니다. 실제 조건은 상담·계약서가 우선합니다.
 */
const n = (v) => Math.max(0, Number(v) || 0);

export function isTireRentalEligible({ age } = {}) {
  const a = Number(age);
  return Number.isFinite(a) && a >= 30 && a <= 65;
}

export function tireRentalCompare(o = {}) {
  const months = Math.round(n(o.months));
  if (!(months >= 1 && months <= 60)) throw new Error('기간은 1~60개월');
  const useCard = !!o.usePartnerCard;
  const disc = useCard ? n(o.cardDiscount) : 0;
  const discMonths = Math.min(months, Math.round(n(o.cardMonths ?? months)));
  const total = n(o.monthly) * months + n(o.setupFee) - disc * discMonths;
  return {
    months,
    total: Math.round(total),
    monthlyAvg: Math.round(total / months),
    cardApplied: useCard && disc > 0,
  };
}
