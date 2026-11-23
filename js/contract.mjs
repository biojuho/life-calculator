/* 인터넷·통신 약정 만료일 계산 (브라우저 전용, 입력값은 서버로 보내지 않음)
 * 만료일 = 가입(개통)일 + 약정 개월 − 1일. 통신사마다 기준일(개통일·설치일)과 말일 처리 규칙이 다를 수 있으므로
 * 결과는 참고용이며, 정확한 날짜는 통신사 앱·고객센터에서 확인해야 합니다.
 */
function parts(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
  return { y, mo, d };
}
function iso(t) { return t.toISOString().slice(0, 10); }
function utc(p) { return Date.UTC(p.y, p.mo - 1, p.d); }

/** 시작일에 개월 수를 더함. 말일 넘침은 그 달 말일로 맞춤 (1/31 + 1개월 = 2/28 또는 2/29). */
export function addMonthsISO(startISO, months) {
  const p = parts(startISO);
  if (!p) throw new Error('날짜 형식은 YYYY-MM-DD');
  const total = p.mo - 1 + Number(months);
  const y = p.y + Math.floor(total / 12);
  const mo = ((total % 12) + 12) % 12;
  const last = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
  return iso(new Date(Date.UTC(y, mo, Math.min(p.d, last))));
}

/**
 * @param {{start:string, months:number, today:string, monthlyNow?:number, monthlyNew?:number}} o
 */
export function contractStatus(o) {
  const months = Math.round(Number(o.months));
  if (!(months >= 1 && months <= 60)) throw new Error('약정 기간은 1~60개월');
  if (!parts(o.start) || !parts(o.today)) throw new Error('날짜 형식은 YYYY-MM-DD');
  const endNext = addMonthsISO(o.start, months); // 약정이 끝난 다음 날
  const end = iso(new Date(utc(parts(endNext)) - 86400000));
  const daysLeft = Math.round((utc(parts(end)) - utc(parts(o.today))) / 86400000);
  const totalDays = Math.round((utc(parts(endNext)) - utc(parts(o.start))) / 86400000);
  const elapsed = Math.round((utc(parts(o.today)) - utc(parts(o.start))) / 86400000);
  const pct = Math.max(0, Math.min(100, Math.round((elapsed / totalDays) * 1000) / 10));
  let stage;
  if (elapsed < 0) stage = 'before';
  else if (daysLeft < 0) stage = 'expired';
  else if (daysLeft <= 60) stage = 'soon';
  else stage = 'running';
  // 만료 뒤 같은 요금을 그대로 낼 때, 새 요금과의 월 차액 (둘 다 넣었을 때만)
  const a = Number(o.monthlyNow) || 0, b = Number(o.monthlyNew) || 0;
  const monthlyGap = a > 0 && b > 0 ? a - b : null;
  const expiredMonths = stage === 'expired' ? Math.floor(-daysLeft / 30.4375) : 0;
  return { end, endNext, daysLeft, totalDays, elapsed, pct, stage, monthlyGap,
    expiredMonths, paidExtraEstimate: monthlyGap && monthlyGap > 0 ? monthlyGap * expiredMonths : 0 };
}
