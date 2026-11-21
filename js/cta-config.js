/* 상담 신청 CTA 설정 — 제휴 링크는 이 파일 한 곳에서만 바꿉니다.
 * 지금은 제휴(CPA) 플랫폼에 가입하지 않았으므로 enabled:false 입니다.
 * 켜는 법: enabled를 true로, url에 제휴 링크를, disclosure에 대가성 표시 문구를 넣습니다.
 * enabled가 false이거나 url이 비어 있으면 버튼은 '준비 중'으로 보이고 링크가 걸리지 않습니다.
 */
export const CTA = {
  internet: {
    enabled: false,
    url: '',
    label: '인터넷 요금 상담 신청',
    partner: '',            // 예: '○○ 제휴사' (표시용)
    disclosure: '이 버튼은 제휴 링크입니다. 링크를 통해 상담·가입이 이뤄지면 생활계산서가 제휴사로부터 수수료를 받을 수 있습니다.',
  },
};
