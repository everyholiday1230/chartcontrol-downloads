# ChartControl — 리디자인 시안 검수 패키지 (1차)

작성일: 2026-10-11 · 브랜치: `redesign/staff-review-2026-10-11`

운영 저장소 반영 **전** 검수용입니다. `screens/` 안의 HTML은 전부 단일 파일이라
빌드·설치 없이 브라우저로 바로 열립니다.

## 검수 대상 7개 화면

| # | 파일 | 화면 | 핵심 |
|---|---|---|---|
| 1 | `trade.html` | 트레이딩 터미널 | 레일 44 / 마켓워치 226 / 차트 / 주문 262 + 하단 블로터, 캔들 190봉 + MA20·60·120 + AI 레벨 3개 |
| 2 | `strategies.html` | 전략 라이브러리 | 15종 규칙 카드 + 실계산 지표(Net / Max DD / PF / Trades) + 자산곡선 |
| 3 | `autotrade.html` | 자동매매 룰 빌더 | ALL/ANY 조건 빌더 · IF…THEN 번역 · 백테스트 리포트 12행 · 봇 카드 |
| 4 | `ai.html` | AI 코파일럿 | 3열 236/1042/322, 4탭, 라이브 스텝 원장, 툴콜 카드, 인용, 승인 체크포인트 |
| 5 | `markets.html` | 마켓 · 스캐너 | KPI 4장, 16행(라이브 2 + 미상장 14), Screens 템플릿, 컬럼 세트, Undo/Redo, AI 스크리너 |
| 6 | `portfolio.html` | 포트폴리오 · 분석 · 지갑 · 설정 | 라우트 4종 + 서브탭 4종, 자산곡선(샘플 표기), 일별 PnL, 지갑 3장, 설정 7섹션 |
| 7 | `admin.html` | 운영 콘솔 | 관리자 20개 라우트, 커맨드 메뉴(Ctrl+K), 감사 로그, 권한 게이트 6곳 |

## 검수 포인트
1. 실제 앱과 비교해 레이아웃·밀도·정보 구조가 맞는지
2. 색·폰트가 운영 토큰과 일치하는지 (`reports/real-tokens.json` 이 실측 기준값)
3. 앱에서 실제로 동작하지 않는 기능이 시안에 섞여 있는지
4. 반영 우선순위

## 이 시안에 적용된 정직성 원칙
- 앱이 노출하지 않는 값은 지어내지 않고 `not exposed` 로 표기
- 샘플 데이터 차트에는 `SAMPLE — not your account` 라벨 부착
- 백테스트가 나쁘면 나쁜 대로 노출 (예: Win 25.0%, PF 0.67)
- 관리자 화면에서 읽지 못한 수치는 `never estimated here` 로 표기
- 금액 이동·계정 대행(impersonation) 등 위험 동작은 비활성 처리

## 제품팀 결정이 필요한 불일치 2건
| 마케팅 표기 | 앱 실측 | 비고 |
|---|---|---|
| `660+ USDT perpetual pairs` | `2 of 21 pairs live` | 둘 중 하나가 틀림 |
| `24-column workspace` | `96-col Layout` | 표기 통일 필요 |

## 측정 근거
- 앱 토큰 323개 / 16 선택자 블록을 `getComputedStyle` 로 실측 → `reports/real-tokens.json`
- 대비 측정은 Chromium 이 `oklch()` 를 그대로 반환하므로 canvas 픽셀 샘플링으로 RGB 변환해 계산
- 검증 뷰포트 1600×1000 (스크린샷 2배 = 3200×2000)
- `reports/gap-analysis.md` — 목업과 실제 제품의 기능 차이

## 이번 범위에서 제외
- 랜딩 페이지 (별도 진행)
- 로그인 · 회원가입 · 비밀번호 재설정 (인증 플로우)
- 법무 5종 (terms / privacy / risk / refund) — 실제 레포에 존재, 플레이스홀더 점검 필요
- partner · billing · status · guide — 이전 목업에만 있던 지어낸 기능이라 재디자인 대상 제외
