# 생활계산서

연봉 실수령액, 대출 이자, 퇴직금, 전기요금 등 생활 계산기를 모아 둔 무료 웹 도구입니다. 제휴 링크와 광고는 넣지 않았습니다.

- 사이트: https://biojuho.github.io/life-calculator/
- 계산 기준 연도: 2026년 요율

이 저장소의 루트가 GitHub Pages로 배포됩니다(`main` 브랜치 push → `.github/workflows/pages.yml`).

- 테스트: `node --test tests/*.test.mjs`
- 인터넷 요금 비교의 상담 신청 버튼은 `js/cta-config.js`의 `CTA.internet`에서만 켭니다(`enabled`, `url`, `partner`, `disclosure`). 지금은 꺼져 있어 '준비 중'으로 보입니다.

- 방문 통계: 모든 페이지가 `js/track.js`를 불러 pageview·calc_done·cta_click·outbound·share 이벤트를 Supabase Edge Function `lc-track`(프로젝트 ai-workspace HC1) → `public.lc_events`로 보냅니다. 쿠키·IP·입력값은 저장하지 않고, DNT/GPC가 켜져 있으면 보내지 않습니다. 일별 요약은 `lc_stats.daily` 뷰.
