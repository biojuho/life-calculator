/* 중·고등 학원비와 과외비를 같은 기간의 총액으로 비교합니다.
 * 학원 총액 = 월 수강료×개월 + 교재비
 * 과외 총액 = 회당 비용×주당 횟수×4.3주×개월 + 교재비
 * 4.3은 한 달을 주로 환산하는 참고값입니다. 실제 수강료는 학원·선생님 안내가 우선합니다.
 */
const n = (v) => Math.max(0, Number(v) || 0);

export const TUTORING_GRADES = ['중1', '중2', '중3', '고1', '고2'];
export const TUTORING_REGIONS = ['서울', '경기', '인천', '부산', '울산', '양산', '김해'];
export const WEEKS_PER_MONTH = 4.3;

export function isTutoringEligible({ grade, region } = {}) {
  return TUTORING_GRADES.includes(String(grade || '')) && TUTORING_REGIONS.includes(String(region || ''));
}

export function tutoringCost(o = {}) {
  const months = Math.round(n(o.months) || 0);
  if (!(months >= 1 && months <= 24)) throw new Error('기간은 1~24개월');
  const academy = n(o.academyMonthly) * months + n(o.academyMaterials);
  const sessions = n(o.tutorPerSession) * n(o.sessionsPerWeek) * WEEKS_PER_MONTH * months;
  const tutor = sessions + n(o.tutorMaterials);
  return {
    months,
    academy: Math.round(academy),
    tutor: Math.round(tutor),
    academyMonthlyAvg: Math.round(academy / months),
    tutorMonthlyAvg: Math.round(tutor / months),
    diff: Math.round(academy - tutor),
  };
}
