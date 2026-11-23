/* 인터넷 요금 비교: 3선택 총액·진단 점수·공유 링크. 브라우저/노드 공통. */

export const MAX_CASH_BENEFIT_REF = 480_000;
export const RENEW_GIFT_NOTE = '보통 상품권 십만원대, 직접 금액을 넣으면 다시 계산';
export const LOSS_LABEL = '지금은 손해일 수 있음';
export const CTA_LABEL_READY = '상담 받고 절약액 확인하기';
export const CTA_LABEL_WAIT = '만료 달력만 받아 두기';
export const CTA_HINT_READY = '상담만 요청, 가입은 나중에';
export const CTA_HINT_WAIT = '지금은 위약금 때문에 손해볼 수 있어요';

const n0 = (v) => Math.max(0, Number(v) || 0);

export function formatManwon(won) {
  const n = Math.round(Number(won) || 0);
  const abs = Math.abs(n);
  if (abs < 10_000) return `${n.toLocaleString('ko-KR')}원`;
  return `${Math.round(n / 10_000).toLocaleString('ko-KR')}만원`;
}

export function termLabelFor(term) {
  const t = Math.round(n0(term));
  if (t === 36) return '3년';
  if (t === 24) return '2년';
  if (t === 12) return '1년';
  return `${t}개월`;
}

/** 절약액 구간 가점. 테스트로 고정: 10만 미만 +10, 10만 +20, 20만 +30, 40만 +40. */
export function savingsBracketPoints(savings) {
  const s = Number(savings) || 0;
  if (s <= 0) return 0;
  if (s >= 400_000) return 40;
  if (s >= 200_000) return 30;
  if (s >= 100_000) return 20;
  return 10;
}

/**
 * 0–100점. 높을수록 지금 바꿔 볼 이유가 큼.
 * - 남은 약정 0개월 +40
 * - 변경 총액이 유지보다 작으면 절약액 구간 +10~+40
 * - 위약금이 최대 48만원 참고치보다 크면 -30
 */
export function diagnoseInternet({
  remainingMonths = 0,
  stayTotal = 0,
  switchNowTotal = 0,
  penalty = 0,
  term = 36,
  savingsNow,
  maxCashBenefit = MAX_CASH_BENEFIT_REF,
} = {}) {
  const rem = Math.max(0, Math.round(n0(remainingMonths)));
  const stay = Number(stayTotal) || 0;
  const sw = Number(switchNowTotal) || 0;
  const pen = n0(penalty);
  const savings = savingsNow != null ? Number(savingsNow) || 0 : stay - sw;
  const t = Math.max(1, Math.round(n0(term) || 1));

  let score = 0;
  if (rem === 0) score += 40;
  score += savingsBracketPoints(savings);
  if (pen > maxCashBenefit) score -= 30;
  score = Math.max(0, Math.min(100, score));

  const inContract = rem > 0;
  const switchWorse = sw >= stay;
  const warnLoss = inContract && switchWorse;
  const lossLabel = warnLoss ? LOSS_LABEL : '';
  const termLabel = termLabelFor(t);

  let headline;
  if (warnLoss) {
    headline = `약정이 ${rem}개월 남아 지금은 유지가 나음`;
  } else if (savings > 0) {
    headline = `나는 ${termLabel} 기준 ${formatManwon(savings)} 아낄 수 있음`;
  } else if (savings < 0) {
    headline = `${termLabel} 기준 지금은 유지가 나음`;
  } else {
    headline = `${termLabel} 기준으로 유지와 변경 총액이 같음`;
  }

  return {
    score,
    lossLabel,
    warnLoss,
    headline,
    termLabel,
    savings,
    ctaLabel: warnLoss ? CTA_LABEL_WAIT : CTA_LABEL_READY,
    ctaHint: warnLoss ? CTA_HINT_WAIT : CTA_HINT_READY,
  };
}

/**
 * 유지 / 재약정 / 변경 총비용.
 * 총비용 = 월요금 × 개월 + 설치비 + 위약금 − 사은품(아는 금액만).
 * 캠페인 현금(최대 48만원+@)은 확정 숫자가 아니므로 총액에서 빼지 않는다.
 */
export function threeOptions({
  currentMonthly = 0,
  newMonthly = 0,
  term = 36,
  penalty = 0,
  installFee = 0,
  benefit = 0,
  renewMonthly,
  renewGift,
  renewGiftKnown = false,
} = {}) {
  const t = Math.max(1, Math.round(n0(term) || 1));
  const cur = n0(currentMonthly);
  const stayTotal = Math.round(cur * t);

  const giftKnown = renewGiftKnown === true;
  const rMonth = renewMonthly == null || renewMonthly === '' ? cur : n0(renewMonthly);
  const gift = giftKnown ? n0(renewGift) : 0;
  const renewTotal = Math.round(rMonth * t - gift);

  const changeTotal = Math.round(n0(newMonthly) * t + n0(penalty) + n0(installFee) - n0(benefit));

  const stay = {
    key: 'stay',
    label: '지금 통신사 유지',
    total: stayTotal,
    benefit: 0,
    note: '유지하면 혜택 0원',
  };
  const renew = {
    key: 'renew',
    label: '지금 통신사 재약정',
    total: renewTotal,
    giftKnown,
    note: giftKnown ? null : RENEW_GIFT_NOTE,
  };
  const change = {
    key: 'change',
    label: '통신사 변경 상담',
    total: changeTotal,
    note: '통신사 변경 시 최대 48만원 + @ 현금 혜택 (상담에서 확정, 유지 시 혜택 없음)',
  };

  const totals = [stayTotal, renewTotal, changeTotal];
  const min = Math.min(...totals);
  const winners = [];
  if (stayTotal === min) winners.push('stay');
  if (renewTotal === min) winners.push('renew');
  if (changeTotal === min) winners.push('change');
  // 재약정 혜택을 모르면 유지와 총액이 같을 때 유지만 최선으로 표시
  const bestKeys = (!giftKnown && winners.length > 1 && winners.includes('stay') && winners.includes('renew'))
    ? winners.filter((k) => k !== 'renew')
    : winners;

  stay.isBest = bestKeys.includes('stay');
  renew.isBest = bestKeys.includes('renew');
  change.isBest = bestKeys.includes('change');

  return { stay, renew, change, term: t };
}

export function buildShareSearch(inputs = {}) {
  const p = new URLSearchParams();
  const set = (k, v) => {
    if (v == null || v === '') return;
    p.set(k, String(v));
  };
  set('cur', inputs.currentMonthly);
  set('rem', inputs.remainingMonths);
  set('pen', inputs.penalty);
  set('nw', inputs.newMonthly);
  set('term', inputs.newTermMonths);
  set('ben', inputs.benefit);
  set('inst', inputs.installFee);
  if (inputs.renewMonthly != null && inputs.renewMonthly !== '') set('rnw', inputs.renewMonthly);
  if (inputs.renewGiftKnown) set('rgift', inputs.renewGift ?? 0);
  return p.toString();
}

export function parseShareSearch(search) {
  if (search == null || search === '') return null;
  const raw = String(search);
  const p = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);
  const num = (k) => {
    if (!p.has(k)) return undefined;
    const v = Number(String(p.get(k)).replace(/,/g, ''));
    return Number.isFinite(v) ? v : undefined;
  };
  const out = {
    currentMonthly: num('cur'),
    remainingMonths: num('rem'),
    penalty: num('pen'),
    newMonthly: num('nw'),
    newTermMonths: num('term'),
    benefit: num('ben'),
    installFee: num('inst'),
  };
  if (p.has('rnw')) out.renewMonthly = num('rnw');
  if (p.has('rgift')) {
    out.renewGift = num('rgift');
    out.renewGiftKnown = true;
  }
  if (out.currentMonthly == null && out.newMonthly == null) return null;
  return out;
}

export function buildShareUrl(base, inputs) {
  const q = buildShareSearch(inputs);
  const b = String(base || '').replace(/#.*$/, '').replace(/\?.*$/, '');
  return q ? `${b}?${q}` : b;
}

export function shortShareHost(url) {
  return String(url || '').replace(/^https?:\/\//, '').split('?')[0];
}
