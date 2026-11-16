/* 생활계산서 계산 엔진 (2026년 한국 공개 요율)
 * 출처는 함수 위 주석. 결과는 참고용이며 고지서·홈택스·계약서와 다를 수 있습니다.
 */
import { TAX_BANDS_CHEON, TAX_AT_10000K } from './tax-table-2026.js';

const wonFloor = (n) => (n >= 0 ? Math.floor(n) : Math.ceil(n));
const wonRound = (n) => Math.round(n);
const wonFloor10 = (n) => wonFloor(n / 10) * 10;

/* 국민연금: 보건복지부고시 제2026-31호(시행 2026.7.1.)
 * 기준소득월액 하한 410,000원, 상한 6,590,000원 (2026.7~2027.6분)
 * 보험료율 9.5% 중 근로자 4.75% (국민연금법). 기준소득월액은 천원 미만 절사.
 * 확인: https://www.law.go.kr/admRulLsInfoR.do?admRulSeq=2100000274228
 */
export const NPS = {
  workerRate: 0.0475,
  floor: 410_000,
  ceiling: 6_590_000,
  period: '2026-07 ~ 2027-06',
};

/* 건강보험·장기요양: 2026년 직장가입자 근로자 부담
 * 건강보험 3.595%, 장기요양 = 건강보험료의 13.14%.
 * (국민건강보험공단·4대보험 안내, 2026년 요율)
 * 보수월액 하한·상한은 고액·저액에서만 영향을 줍니다.
 * 하한 280,667원 / 상한 127,725,731원: 4대사회보험 정보연계센터 안내를 참고(고시 원문은 변동될 수 있음).
 */
export const NHIS = {
  workerRate: 0.03595,
  ltcRateOnHealth: 0.1314,
  floor: 280_667,
  ceiling: 127_725_731,
};

/* 고용보험 실업급여 근로자 부담 0.9% (2026년, 변동 없음으로 안내된 요율).
 * 고용안정·직업능력개발 부담금은 사업주만 부담하므로 실수령 계산에 넣지 않습니다.
 */
export const EI = { workerRate: 0.009 };

/* 식대 비과세 한도 월 200,000원 등(소득세법 시행령). 입력값은 사용자가 넣습니다. */

/**
 * 근로소득 간이세액표 조회 (소득세법 시행령 별표2, 2026.2.27. 개정, 2026.3.1. 적용)
 * monthlyTaxable: 비과세·학자금을 뺀 월급여액(원)
 * dependents: 공제대상가족 수(본인 포함, 1~11+)
 * children8to20: 그중 8세 이상 20세 이하 자녀 수
 * ratePct: 맞춤형 원천징수 80 | 100 | 120
 * 반환: 근로소득세(원). 지방소득세는 별도(이 세액의 10%, 원 미만 절사).
 */
export function incomeTaxWithholding(monthlyTaxable, dependents = 1, children8to20 = 0, ratePct = 100) {
  const pay = Math.max(0, Math.floor(monthlyTaxable));
  const fam = Math.max(1, Math.floor(dependents));
  const kids = Math.max(0, Math.floor(children8to20));
  let tax;
  if (pay < 770_000) {
    tax = 0;
  } else if (pay <= 10_000_000) {
    if (pay === 10_000_000) {
      tax = TAX_AT_10000K[Math.min(fam, 11) - 1];
    } else {
      const cheon = pay / 1000; // 이상 미만은 천원 구간
      const row = TAX_BANDS_CHEON.find((r) => cheon >= r[0] && cheon < r[1]);
      if (!row) tax = 0;
      else if (fam <= 11) tax = row[1 + fam]; // index 2 = family 1
      else {
        // 별표2 제4호: 11명 초과 시 11명 세액에서 (10명-11명 차) * 초과 인원
        const t10 = row[11];
        const t11 = row[12];
        tax = t11 - (t10 - t11) * (fam - 11);
      }
    }
  } else {
    const t10k = TAX_AT_10000K[Math.min(fam, 11) - 1];
    // fam>11: 10,000천원 행에도 같은 규칙 적용
    const base10 = (() => {
      if (fam <= 11) return TAX_AT_10000K[fam - 1];
      const t10 = TAX_AT_10000K[9];
      const t11 = TAX_AT_10000K[10];
      return t11 - (t10 - t11) * (fam - 11);
    })();
    if (pay <= 14_000_000) {
      tax = base10 + (pay - 10_000_000) * 0.98 * 0.35 + 25_000;
    } else if (pay <= 28_000_000) {
      tax = base10 + 1_397_000 + (pay - 14_000_000) * 0.98 * 0.38;
    } else if (pay <= 30_000_000) {
      tax = base10 + 6_610_600 + (pay - 28_000_000) * 0.98 * 0.40;
    } else if (pay <= 45_000_000) {
      tax = base10 + 7_394_600 + (pay - 30_000_000) * 0.40;
    } else if (pay <= 87_000_000) {
      tax = base10 + 13_394_600 + (pay - 45_000_000) * 0.42;
    } else {
      tax = base10 + 31_034_600 + (pay - 87_000_000) * 0.45;
    }
    tax = wonFloor(tax);
  }
  tax = Math.max(0, tax);
  // 별표2 제3호: 8~20세 자녀 세액공제 (2026.2.27. 개정 금액)
  let childCredit = 0;
  if (kids === 1) childCredit = 20_830;
  else if (kids === 2) childCredit = 45_830;
  else if (kids >= 3) childCredit = 45_830 + (kids - 2) * 33_330;
  tax = Math.max(0, tax - childCredit);
  if (ratePct === 80 || ratePct === 120) tax = wonFloor((tax * ratePct) / 100);
  return tax;
}

export function localIncomeTax(incomeTax) {
  // 지방세법: 소득세의 10%, 원 미만 절사
  return wonFloor(incomeTax * 0.1);
}

export function fourInsurance(monthlyTaxable) {
  const base = Math.max(0, monthlyTaxable);
  // 국민연금 기준소득월액: 천원 미만 절사 후 하한·상한
  let npsBase = wonFloor(base / 1000) * 1000;
  npsBase = Math.min(Math.max(npsBase, NPS.floor), NPS.ceiling);
  const pension = wonFloor(npsBase * NPS.workerRate);
  let nhisBase = Math.min(Math.max(base, NHIS.floor), NHIS.ceiling);
  const health = wonFloor(nhisBase * NHIS.workerRate);
  const ltc = wonRound(health * NHIS.ltcRateOnHealth);
  const employment = wonFloor(base * EI.workerRate);
  const total = pension + health + ltc + employment;
  return { pension, health, ltc, employment, total, npsBase, nhisBase };
}

/**
 * 연봉 실수령액
 * annual: 세전 연봉(원). monthly는 연봉/12 원 미만 절사(기본).
 */
export function takeHome({
  annual,
  monthly: monthlyIn,
  nontaxable = 0,
  dependents = 1,
  children8to20 = 0,
  ratePct = 100,
}) {
  const monthly = monthlyIn != null ? Math.floor(monthlyIn) : wonFloor(annual / 12);
  const nontax = Math.max(0, Math.floor(nontaxable));
  const taxable = Math.max(0, monthly - nontax);
  const ins = fourInsurance(taxable);
  const incomeTax = incomeTaxWithholding(taxable, dependents, children8to20, ratePct);
  const local = localIncomeTax(incomeTax);
  const deduct = ins.total + incomeTax + local;
  const netMonth = monthly - deduct;
  return {
    monthly,
    taxable,
    nontaxable: nontax,
    ...ins,
    incomeTax,
    local,
    deduct,
    netMonth,
    netYear: netMonth * 12,
  };
}

/* 주택용 전기요금 (한국전력 기본공급약관 별표1, 주택용 저압·고압)
 * 기본요금·전력량요금 단가는 2023.5.16. 적용분과 동일하며, 2026.10 확인 기준으로 주택용 단가 변경 공지 없음.
 * 근거: 법제처 생활법령정보(기본공급약관 2026.4.1. 시행) https://www.easylaw.go.kr/CSP/IssueQaRetrieve.laf?issueqaSeq=407
 * 하계 구간: 7.1~8.31. 슈퍼유저(하계·동계 1,000kWh 초과) 저압 736.2원, 고압 601.3원.
 * 기후환경요금 9.0원/kWh (2023.1.1.~).
 * 연료비조정단가: 분기마다 변경. 기본값 +5.0원/kWh는 2026.10.1.~12.31. (한전 2026년 4분기 공지, 2026.9.21.)
 * 부가가치세 10% (원 미만 반올림). 전력산업기반기금 2.7% (전기사업법 시행령 제36조, 2025.7.1. 이후 사용분, 10원 미만 절사).
 * 청구금액 10원 미만 절사. 복지할인·대가족 할인·아파트 단일계약은 반영하지 않습니다.
 * 월간 최저요금 1,000원(저압, 별표1).
 */
export const ELEC = {
  climate: 9.0,
  defaultFuel: 5.0,
  vat: 0.1,
  fund: 0.027,
  minChargeLow: 1000,
  low: {
    base: [910, 1600, 7300],
    energy: [120.0, 214.6, 307.3],
    superUser: 736.2,
  },
  high: {
    base: [730, 1260, 6060],
    energy: [105.0, 174.0, 242.3],
    superUser: 601.3,
  },
};

function elecTiers(kwh, summer) {
  if (summer) return [300, 450];
  return [200, 400];
}

export function electricityBill({
  kwh,
  summer = false,
  winter = false,
  voltage = 'low',
  fuel = ELEC.defaultFuel,
}) {
  const use = Math.max(0, Number(kwh) || 0);
  const sch = voltage === 'high' ? ELEC.high : ELEC.low;
  const [t1, t2] = elecTiers(use, summer);
  let step = 0;
  if (use > t2) step = 2;
  else if (use > t1) step = 1;
  const base = sch.base[step];
  const a = Math.min(use, t1);
  const b = Math.min(Math.max(use - t1, 0), t2 - t1);
  const c = Math.max(use - t2, 0);
  let energy = a * sch.energy[0] + b * sch.energy[1] + c * sch.energy[2];
  // 슈퍼유저: 하계(7~8월)·동계(12~2월) 1,000kWh 초과분. 해당 초과분은 3단계 단가 대신 슈퍼유저 단가.
  let superKwh = 0;
  if ((summer || winter) && use > 1000) {
    superKwh = use - 1000;
    // 3단계로 들어간 사용량 중 1,000 초과분만 차액 보정
    const over3 = Math.max(use - t2, 0);
    const superIn3 = Math.min(superKwh, over3);
    energy = energy - superIn3 * sch.energy[2] + superIn3 * sch.superUser;
  }
  energy = wonFloor(energy);
  const climate = use * ELEC.climate;
  const fuelAmt = use * fuel;
  let subtotal = base + energy + climate + fuelAmt;
  if (voltage !== 'high' && subtotal < ELEC.minChargeLow && use > 0) subtotal = ELEC.minChargeLow;
  subtotal = wonFloor(subtotal); // 원 미만이 있으면 버림
  const vat = wonRound(subtotal * ELEC.vat);
  const fund = wonFloor10(subtotal * ELEC.fund);
  const bill = wonFloor10(subtotal + vat + fund);
  return {
    step: step + 1,
    base,
    energy,
    climate,
    fuel: fuelAmt,
    subtotal,
    vat,
    fund,
    bill,
    tiers: { a, b, c, superKwh },
  };
}

/* 부가가치세 10% (부가가치세법 제14조 등).
 * 세금계산서 관행: 공급가액 = 합계/1.1 원 미만 반올림, 부가세 = 합계 - 공급가액.
 * 공급가액에서 출발할 때는 부가세 = 공급가액 * 10% 원 미만 반올림, 합계 = 공급가액 + 부가세.
 */
export function vatFromSupply(supply) {
  const s = wonRound(Number(supply) || 0);
  const vat = wonRound(s * 0.1);
  return { supply: s, vat, total: s + vat };
}
export function vatFromTotal(total) {
  const t = wonRound(Number(total) || 0);
  const supply = wonRound(t / 1.1);
  const vat = t - supply;
  return { supply, vat, total: t };
}

/* 1평 = 400/121 ㎡
 * (1보는 6자, 1자는 10/33m, 1평 = 36 제곱자 = 36 * (10/33)^2 = 3600/1089 = 400/121 ㎡)
 * 흔히 3.3058㎡로 반올림해 표기합니다.
 */
export const Pyeong = 400 / 121;
export function pyeongToM2(p) {
  return Number(p) * Pyeong;
}
export function m2ToPyeong(m) {
  return Number(m) / Pyeong;
}

/* 퇴직금: 근로자퇴직급여 보장법
 * 퇴직금 = 1일 평균임금 × 30일 × (재직일수 / 365)
 * 평균임금 = 퇴직일 이전 3개월 임금 총액 / 그 3개월의 총 일수
 * 평균임금이 통상임금보다 낮으면 통상임금을 평균임금으로 씀.
 * 출처: 고용노동부 https://www.moel.go.kr/faq/faqView.do?seqRepeat=89
 *        생활법령정보 퇴직금 지급
 */
export function severancePay({ wage3monthTotal, days3month, serviceDays, ordinaryDaily }) {
  if (days3month <= 0 || serviceDays <= 0) return { avgDaily: 0, usedDaily: 0, amount: 0 };
  const avgDaily = wage3monthTotal / days3month;
  const usedDaily = ordinaryDaily && ordinaryDaily > avgDaily ? ordinaryDaily : avgDaily;
  const amount = usedDaily * 30 * (serviceDays / 365);
  return { avgDaily, usedDaily, amount };
}

/** 달력 일수 기준 두 날짜 사이 일수(종료-시작). 시작일·종료일을 포함하려면 +1. */
export function calendarDays(startISO, endISO) {
  const a = dateUTC(startISO);
  const b = dateUTC(endISO);
  return Math.round((b - a) / 86400000);
}

function dateUTC(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/* 대출 이자
 * 원리금균등: M = P * r * (1+r)^n / ((1+r)^n - 1)
 * 원금균등: 매월 원금 = P/n, 이자 = 잔액 * r
 * r = 연이율/12 (월 이자율). 이자일은 월 단위 모형이며, 실제 상품의 일수계산(여신관행)과 다를 수 있습니다.
 */
export function loanEqualPayment(principal, annualRate, months) {
  const P = Number(principal);
  const n = Math.floor(Number(months));
  const r = Number(annualRate) / 12;
  if (n <= 0) return { monthly: 0, schedule: [], totalInterest: 0, totalPay: 0 };
  let monthly;
  if (r === 0) monthly = P / n;
  else monthly = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  let bal = P;
  const schedule = [];
  let totalInterest = 0;
  for (let i = 1; i <= n; i++) {
    const interest = bal * r;
    let prin = monthly - interest;
    if (i === n) {
      prin = bal;
      monthly = prin + interest;
    }
    bal = Math.max(0, bal - prin);
    totalInterest += interest;
    schedule.push({
      month: i,
      payment: monthly,
      principal: prin,
      interest,
      balance: bal,
    });
  }
  return { monthly: schedule[0].payment, schedule, totalInterest, totalPay: P + totalInterest };
}

export function loanEqualPrincipal(principal, annualRate, months) {
  const P = Number(principal);
  const n = Math.floor(Number(months));
  const r = Number(annualRate) / 12;
  if (n <= 0) return { monthlyFirst: 0, monthlyLast: 0, schedule: [], totalInterest: 0, totalPay: 0 };
  const prinFixed = P / n;
  let bal = P;
  const schedule = [];
  let totalInterest = 0;
  for (let i = 1; i <= n; i++) {
    const interest = bal * r;
    let prin = prinFixed;
    if (i === n) prin = bal;
    const payment = prin + interest;
    bal = Math.max(0, bal - prin);
    totalInterest += interest;
    schedule.push({ month: i, payment, principal: prin, interest, balance: bal });
  }
  return {
    monthlyFirst: schedule[0].payment,
    monthlyLast: schedule[n - 1].payment,
    schedule,
    totalInterest,
    totalPay: P + totalInterest,
  };
}

/* D-day: 한국에서 흔한 표기. 기준일=오늘(Asia/Seoul) 또는 지정일.
 * 남은 날 > 0 이면 D-N (N일 전), 0이면 D-Day, 지나면 D+N.
 */
export function dday(targetISO, fromISO) {
  const days = calendarDays(fromISO, targetISO);
  if (days === 0) return { days, label: 'D-Day', direction: 0 };
  if (days > 0) return { days, label: 'D-' + days, direction: -1 };
  return { days: -days, label: 'D+' + -days, direction: 1 };
}

export function todaySeoulISO(now = new Date()) {
  // en-CA gives YYYY-MM-DD. Asia/Seoul.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/* 글자 수: 유니코드 코드 포인트(한글 1자=1) 기준.
 * bytesUtf8, bytesEucKr 추정(한글·한글 자모 2바이트, 그 외 BMP 1, 그 밖 3 — EUC-KR은 정확한 매핑이 아니므로 '추정').
 */
export function countText(text, { ignoreSpaces = false, ignoreNewlines = false } = {}) {
  let s = String(text ?? '');
  const raw = s;
  if (ignoreNewlines) s = s.replace(/\r\n?|\n/g, '');
  if (ignoreSpaces) s = s.replace(/[ \t\u00A0\u3000]/g, '');
  const chars = Array.from(s);
  const noSpace = Array.from(s.replace(/[ \t\u00A0\u3000]/g, ''));
  const noWs = Array.from(s.replace(/\s/g, ''));
  const lines = raw === '' ? 0 : raw.split(/\r\n?|\n/).length;
  const bytesUtf8 = new TextEncoder().encode(s).length;
  let bytesEuc = 0;
  for (const ch of chars) {
    const cp = ch.codePointAt(0);
    if (cp <= 0x7f) bytesEuc += 1;
    else if ((cp >= 0xac00 && cp <= 0xd7a3) || (cp >= 0x3131 && cp <= 0x318e)) bytesEuc += 2;
    else bytesEuc += 2; // 추정: 대부분의 전각·한글 호환 문자는 2바이트
  }
  return {
    chars: chars.length,
    noSpace: noSpace.length,
    noWhitespace: noWs.length,
    lines,
    bytesUtf8,
    bytesEucKrEstimate: bytesEuc,
  };
}

export function formatWon(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString('ko-KR') + '원';
}

export { wonFloor, wonRound, wonFloor10 };
