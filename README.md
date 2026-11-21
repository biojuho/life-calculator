# 생활계산서

연봉 실수령액, 대출 이자, 퇴직금, 전기요금 등 생활 계산기를 모아 둔 무료 웹 도구입니다. 제휴 링크와 광고는 넣지 않았습니다.

- 사이트: https://biojuho.github.io/life-calculator/
- 계산 기준 연도: 2026년 요율

이 저장소의 루트가 GitHub Pages로 배포됩니다(`main` 브랜치 push → `.github/workflows/pages.yml`).

- 테스트: `node --test tests/*.test.mjs`
- 인터넷 요금 비교의 상담 신청 버튼은 `js/cta-config.js`의 `CTA.internet`에서만 켭니다(`enabled`, `url`, `partner`, `disclosure`). 지금은 꺼져 있어 '준비 중'으로 보입니다.
