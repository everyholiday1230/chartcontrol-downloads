# ChartControl 홈페이지 — 복원본 (브랜드 마젠타 + 3D)

작성일: 2026-10-11 · 브랜치: `chartcontrol-homepage-2026-10-11`

크림/테라코타 시안 이전에 만들었던 **ChartControl 제품 소개 홈페이지(로그인 전)** 원본입니다.
브랜드 마젠타를 전면에 쓰고 히어로에 3D 오브젝트를 넣은 버전입니다.

## 이 페이지가 무엇인가
- **ChartControl 제품 소개 홈페이지** — 범온누리 회사 홈페이지와는 다른 별개 산출물
- 로그인 전 노출되는 제품 마케팅 페이지

## 브랜드 / 3D
| 항목 | 값 |
|---|---|
| 브랜드 색 | 마젠타 `#F00FF0` 계열 (`btn-mag` · `.grad` 그라디언트) |
| 3D 스테이지 | `.stage3d` / `.obj3d` (히어로 우측) |
| 캔버스 | `#herofield` — 3D 필드 애니메이션 |
| 기타 | 뷰 트랜지션(`document.startViewTransition`) 페이지 전환 |

## 섹션 구성
`hero` → `proof` → `#product` → `#how` → `#workspace` → `#terminal` →
`#coverage` → `#trust` → `#pricing` → `#faq` → `.final`

## 히어로 카피
- H1: **Ask the chart.** / *It marks the answer.*
- 리드: "ChartControl reads the candles you are already looking at and draws the entry, the invalidation and the reward-to-risk straight onto the screen. Every level names the rule that produced it and the candle it came from."
- CTA: `Start free` / `See what a read contains`
- 노트: `NO CARD · FREE POINTS ON SIGNUP · FEE DISCOUNT VIA OUR LINK`

## 구성 파일
| 파일 | 내용 |
|---|---|
| `index.html` | **홈페이지 본체** (201KB) |
| `variants/v-A.html` | 히어로 배경 대안 A · aurora mesh |
| `variants/v-ACG.html` | 대안 A + glass + pulse |
| `variants/v-C.html` | 대안 C · glass depth |
| `variants/v-E.html` | 대안 E · scanline console |
| `variants/v-G.html` | 대안 G · chart pulse glow |
| `variants/v-H.html` | 대안 H · starfield parallax |
| `app.html` | 터미널 프리뷰 |
| `brand-tokens.html` | 브랜드 토큰 명세 |
| `indicators.html` · `indicators-v2.html` | 지표 라이브러리 |
| `trade*.html` · `ts-*.html` | 트레이드 화면 계열 |
| `login/signup/reset.html` | 인증 |
| `legal/terms/privacy/refund/risk.html` | 법무 |
| `billing/partner/status/guide/options.html` | 기타 |
| `assets/` | 이미지·폰트 |

## 주의
- 이 브랜치는 **복원 스냅샷**입니다. 개선은 이 위에서 이어갑니다.
- 이전에 만든 크림/테라코타 시안(`redesign/staff-review-2026-10-11` 브랜치)과는 **다른 방향**입니다.

---

# 개선 내역 (2026-10-11 2차)

## 실제로 고친 결함 7건

| # | 결함 | 근거 | 조치 |
|---|---|---|---|
| 1 | **폰트가 하나도 안 불러와짐** — CSS는 `Archivo` / `Public Sans` / `JetBrains Mono`를 선언하는데 로드된 건 IBM Plex + Pretendard뿐. 제목·본문 전부 Arial/Helvetica 폴백으로 렌더 | `getComputedStyle(h1).fontFamily` 실측 | 세 폰트를 Google Fonts에서 로드 |
| 2 | **`--font-mono:var(--font-mono)` 자기참조** → 계산 시 무효. 모든 모노 데이터(티커·수치)가 모노 폰트를 잃음 | 계산값 검사 | 실제 스택으로 교체 |
| 3 | **`--shadow-ink:var(--shadow-ink)` 자기참조** | 계산값 검사 | 실제 그림자 값 부여 |
| 4 | **3D 오브젝트가 무의미** — 임의 높이의 막대 5개, 브랜드에 없는 청록·보라 혼입 | 마크업 검사 | 캔들로 재구성(`--up`/`--dn` 시맨틱) + **TARGET·ENTRY·INVALIDATION 3개 레벨 평면**을 3D로 관통시켜 제품 약속을 그대로 인코딩 |
| 5 | **마젠타 과다** — 바닥 그리드 `.30`, 링 `.28`이 히어로 전체를 마젠타로 덮음 | CSS 검사 | `.15` / `.18`로 감쇠 |
| 6 | **히어로 캡션 대비 4.23:1** (AA 미달) | canvas RGB 측정 | `--steel`로 승격 → 8.85:1 |
| 7 | **preconnect 중복 4줄** | 마크업 검사 | 2줄로 정리 |

## 3D 라벨이 뒤집혀 보이던 문제 (2차 검증에서 발견)

`.obj3d`가 `rotateY 0→360deg`를 계속 돌아서, **회전 후반부에는 라벨이 거울상으로 뒤집혀** 읽혔습니다.
→ `-26deg ~ +26deg` 왕복(`alternate`)으로 변경. 텍스트가 뒤집힐 수 없게 됨.

라벨 크기 8.5px → 10.5px, 어두운 배경 pill + 현재색 1px 보더를 붙였습니다.
라벨이 스테이지 밖으로 잘리지 않도록 레벨선을 스테이지 폭의 `6% ~ 60%` 구간에 고정했습니다.
실측: 라벨 우측 1361px ≤ 스테이지 우측 1406px → **잘림 0**.

## 검증 (실측)
| 항목 | 다크 | 라이트 |
|---|---|---|
| 페이지 오류 | 0 | 0 |
| 레벨 라벨 3개 표시·가독 | 전부 정상 (뒤집힘 없음) | 전부 정상 |
| 라벨 스테이지 내부 포함 | 3/3 `true` | 3/3 `true` |
| 티커 모노 폰트 | JetBrains Mono 적용 | JetBrains Mono 적용 |
| `prefers-reduced-motion` | 라벨 3개 모두 노출 | — |

`reduced-motion` 에서도 레벨 라벨이 사라지지 않는 것을 확인했습니다.
