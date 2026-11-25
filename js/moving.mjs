/* 이사 준비·평수 계산기
 * 전용면적(㎡) → 평, 이사일 D-day, 견적 최대 3곳 합산(기본+사다리차+에어컨 이전·설치+폐기물+엘리베이터+기타).
 * 이사 가격을 추정하거나 시세를 보여 주지 않습니다. 입력값은 브라우저에서만 계산합니다.
 */
import { Pyeong } from './calc.mjs';

const n = (v) => Math.max(0, Number(v) || 0);
export const PYEONG_M2 = Pyeong; // 400/121 ≈ 3.3058

export function seoulYmd(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function daysUntil(isoDate, now = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || '').trim());
  if (!m) return null;
  const today = seoulYmd(now);
  const t0 = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  const t1 = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return Math.round((t1 - t0) / 86400000);
}

export function isMoveDateEligible(isoDate, now = new Date()) {
  const d = daysUntil(isoDate, now);
  return d !== null && d >= 0 && d <= 60;
}

export function m2ToPyeongRounded(m2) {
  const m = Number(m2);
  if (!Number.isFinite(m)) throw new Error('전용면적을 숫자로 넣어 주세요');
  return m / PYEONG_M2;
}

export function quoteTotal(o = {}) {
  return Math.round(n(o.base) + n(o.ladder) + n(o.ac) + n(o.waste) + n(o.elevator) + n(o.extra));
}

export function compareQuotes(quotes = []) {
  const rows = (quotes || []).slice(0, 3).map((q, i) => ({
    index: i + 1,
    label: String(q.label || `${i + 1}번 견적`).trim() || `${i + 1}번 견적`,
    total: quoteTotal(q),
  }));
  const filled = rows.filter((r) => r.total > 0);
  const min = filled.length ? Math.min(...filled.map((r) => r.total)) : null;
  return { rows, min, filled: filled.length };
}

export function isIsabangCtaReady({ dateWithin60, isFamilyMove } = {}) {
  return dateWithin60 === true && isFamilyMove === true;
}
