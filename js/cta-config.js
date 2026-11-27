/* 상담 신청 CTA 설정 — 제휴(홍보) URL은 이 파일의 url 한 곳에서만 바꿉니다.
 * 디비센스 '인터넷 비교원'(승인 1건당 22,000원)용 문구를 넣었습니다.
 * 버튼은 url이 유효한 https 주소이고 enabled가 true일 때만 켜집니다.
 * 2026-11-23 디비센스 사전검수 통과(문의 8741)로 enabled를 true로 켰습니다.
 */
export const AFFILIATE_URL_PLACEHOLDER = 'PLACEHOLDER';

export const SHARE_PAGE_URL = 'https://biojuho.github.io/life-calculator/tools/internet/';

export const CTA = {
  internet: {
    campaign: '인터넷 비교원',
    partner: '디비센스',
    url: 'https://l7nopd392j.sens.kr',
    campaignId: 'dbsense_internet_l7no', // 통계 cta_click에 붙는 캠페인 ID (개인정보 아님)
    enabled: true,
    label: '30초 만에 내 인터넷 혜택·절약액 확인하기 →',
    weakLabel: '만료 달력만 받아 두기',
    eyebrow: '광고 · 제휴 링크 · 디비센스',
    headline: '인터넷 약정 끝나는 분? 그대로 두면 매달 현금 혜택을 그냥 놓칩니다',
    badge: '최대 48만원 + @ 현금 혜택',
    benefit: '통신사 변경 시 최대 48만원 + @ 현금 혜택',
    badgeNote: '디비센스 인터넷 비교원 캠페인에 안내된 금액이며, 위 요금 비교 숫자와는 별도입니다. 상담에서 확정됩니다.',
    audience: '약정 끝난 분 대상 상담입니다.',
    stayNote: '지금 쓰는 통신사를 그대로 유지하면 혜택이 없습니다. (추가 지원금 0원)',
    restriction: '연체·미성년자·신용불량자는 신청 불가',
    disclosure: '이 버튼을 통한 상담 신청 시 운영자는 제휴 수수료를 제공받습니다.',
    consultOnly: '상담만 요청, 가입은 나중에',
    heroCaption: '이미지는 AI로 만든 예시입니다',
  },
};

export function isAffiliateUrlReady(url) {
  const u = String(url ?? '').trim();
  if (!u) return false;
  if (u.toUpperCase() === AFFILIATE_URL_PLACEHOLDER) return false;
  if (/placeholder/i.test(u)) return false;
  if (/\bexample\.(com|invalid|org)\b/i.test(u)) return false;
  return /^https:\/\/\S+$/i.test(u);
}

export function isCtaLive(cta) {
  if (!cta) return false;
  if (cta.enabled !== true) return false;
  return isAffiliateUrlReady(cta.url);
}
