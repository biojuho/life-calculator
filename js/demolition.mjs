/* 철거 비용 가늠. 이용자가 넣은 평수(또는 ㎡)와 평당 가늠 단가로
 * 중간값과 ±20% 범위를 보여 줍니다. 견적 금액은 현장 확인 후 확정되며, 이 숫자는 참고용입니다.
 */
import { m2ToPyeong } from './calc.mjs';

const n = (v) => Math.max(0, Number(v) || 0);

export function isDemolitionEligible({ age } = {}) {
  const a = Number(age);
  return Number.isFinite(a) && a >= 20;
}

export function demolitionEstimate(o = {}) {
  let py = n(o.pyeong);
  if (!py && n(o.m2)) py = m2ToPyeong(n(o.m2));
  if (!(py > 0)) throw new Error('평수 또는 ㎡를 넣어 주세요');
  const unit = n(o.unitCost);
  if (!(unit > 0)) throw new Error('가늠 단가(평당)를 넣어 주세요');
  const mid = py * unit;
  return {
    pyeong: Math.round(py * 100) / 100,
    mid: Math.round(mid),
    low: Math.round(mid * 0.8),
    high: Math.round(mid * 1.2),
  };
}
