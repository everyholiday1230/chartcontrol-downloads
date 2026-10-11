# 범온누리 이노베이션 — 회사 홈페이지 스냅샷 (검수용)

작성일: 2026-10-11 · 브랜치: `company-homepage-snapshot-2026-10-11`

**이 브랜치는 원본을 수정하지 않은 읽기 전용 스냅샷입니다.**
원본 위치: 운영 저장소 `BEOMONNURI-Innovation` → `homepage2/`
(원본 최신 커밋 `0c08f36`)

## 로그인 전 노출되는 페이지

| 파일 | 페이지 | 내용 |
|---|---|---|
| `index.html` | 홈 | 「데이터를 OPERATIONS 성과로」 — 3D 히어로(three.js + WebGL) |
| `products.html` | 제품 전체 | 2개 AI 제품 + 외주·MVP |
| `products-superchart.html` | 범온 슈퍼차트 AI | 차트 분석 제품 소개 |
| `products-agent.html` | 범온 에이전트 AI | 에이전트 제품 소개 |
| `products-private.html` | 범온 프라이빗 AI | 폐쇄망 프라이빗 AI |
| `services-outsourcing.html` | 외주·MVP 제작 | 개발 서비스 |
| `why.html` | Why us | 성능 지표 기준 설계 |
| `contact.html` | 문의 | 연락처 |
| `privacy.html` | 개인정보처리방침 | 법무 |
| `404.html` | 404 | — |

## 3D / 시각 효과 구현
| 항목 | 내용 |
|---|---|
| 3D 엔진 | three.js r128 (cdnjs CDN) |
| 캔버스 3개 | `#hero-canvas` · `#neural-grid` · `#liquid-hero` |
| WebGL | `assets/js/v5-nextgen.js` (WebGL 6회, canvas 32회, rAF 13회) |
| 파트너 로고 | 3D 원통형 회전 캐러셀 (`.partner-cylinder` / `.cylinder-stage`) |
| CSS 3D | `perspective` 4 · `preserve-3d` 3 |
| WebGPU | `assets/js/v5-webgpu.js` |
| 모바일 | `assets/js/v5-mobile.js` |

## 브랜드 색
| 색 | 값 | 사용 |
|---|---|---|
| 딥 크림슨(주 브랜드) | `#921230` | 12회 — 주요 강조 |
| 다크 크림슨 | `#7d0f29` | hover |
| 브라이트 핑크(포인트) | `#ff2d6f` | 1회 |
| 로즈 | `#e8375c` | 1회 |
| 배경 | `#F6F4EF` · `#ECE8DF` · `#D8D3C8` | |
| 텍스트 | `#0D0D0D` · `#161616` · `#3A3A38` · `#9A958A` | |

## 주의 — 원본 수정 금지
이 스냅샷은 검수·열람용입니다. 실제 수정은 원본 저장소
`BEOMONNURI-Innovation/homepage2/` 에서 진행해 주세요.

## 알려진 미완 항목 (원본 README 기준)
- 공식 로고 원본 확인 대기
- 확정형 KPI 문구 완화 1~2차 진행 중
