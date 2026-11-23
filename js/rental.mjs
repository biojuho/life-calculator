/* 렌탈 vs 일시불 구매 총비용 비교 (정수기·공기청정기·비데 등)
 * 렌탈 총비용 = 월 렌탈료×의무개월 + 등록·설치비 − 월 카드할인×할인개월 − 현금·사은품 혜택
 * 구매 총비용 = 구매가 + 설치비 + 월 관리비(필터·방문관리)×같은 기간
 * 입력값은 브라우저에서만 계산합니다. 혜택·카드 할인은 조건(전월 실적 등)이 붙을 수 있어 계약서가 우선합니다.
 */
const n = (v) => Math.max(0, Number(v) || 0);
export function rentalCompare(o) {
  const months = Math.round(n(o.months));
  if (!(months >= 1 && months <= 120)) throw new Error('의무 사용 기간은 1~120개월');
  const discMonths = Math.min(months, Math.round(n(o.cardMonths ?? months)));
  const rental = n(o.monthly) * months + n(o.setupFee) - n(o.cardDiscount) * discMonths - n(o.cashBenefit);
  const buy = n(o.buyPrice) + n(o.buySetup) + n(o.buyCare) * months;
  const hasBuy = n(o.buyPrice) > 0;
  // 몇 개월째부터 구매가 더 싸지는지 (월 단위 누적 비교)
  let breakEven = null;
  if (hasBuy) {
    for (let m = 1; m <= months; m++) {
      const r = n(o.monthly) * m + n(o.setupFee) - n(o.cardDiscount) * Math.min(m, discMonths) - n(o.cashBenefit);
      const b = n(o.buyPrice) + n(o.buySetup) + n(o.buyCare) * m;
      if (b <= r) { breakEven = m; break; }
    }
  }
  return {
    months, rental: Math.round(rental), rentalMonthly: Math.round(rental / months),
    buy: hasBuy ? Math.round(buy) : null, diff: hasBuy ? Math.round(rental - buy) : null, breakEven,
  };
}
