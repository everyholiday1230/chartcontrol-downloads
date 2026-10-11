# 이식 계약서 — 샌드박스 목업 → 실제 제품

작성: 2026-10-11 · 대상: `chart-control` 레포에 목업을 이식하는 작업자
전제: 목업은 **샌드박스 단독 HTML**(31페이지 + 변형 6종)이고, 제품은 **`packages/design-tokens/` 기반 디자인 시스템**입니다. 둘은 **서로 다른 시스템**이므로 그대로 복사하면 깨집니다.

---

## 0. 이식 전 필수 선행 (지금 안 되어 있음)

| 순서 | 작업 | 상태 |
|---|---|---|
| 1 | **PR #2 머지** (`brand/f00ff0-token-unification`) — `src/tokens.css`에 브랜드 `#F00FF0` 반영 | **open, 미머지** |
| 2 | **PR #3 머지** (`feat/indicator-library-v2`) — `--chart-line-1..8` 토큰 의존 | **open, 미머지** |

`main` 현재 HEAD: `f251bbc`. **PR #2를 먼저 머지하지 않으면** 이식한 화면의 브랜드 색이 제품 토큰과 어긋납니다.

---

## 1. 절대 그대로 옮기면 안 되는 것 3가지

### 1-1. 롱/숏 색이 **반대**입니다 (최대 위험)

| | 목업 | 제품 |
|---|---|---|
| 롱/상승 | `--up: #25D07A` (그린) | `--trade-long-500: oklch(72% 0.14 175)` (**틸**) |
| 숏/하락 | `--dn: #FF4D6A` (레드) | `--trade-short-500: oklch(68% 0.22 355)` (**마젠타**) |

목업의 그린/레드를 그대로 이식하면 **제품의 틸/마젠타 체계가 깨집니다.** 캔들·PnL·포지션 배지 전부 영향받습니다.
→ 제품 토큰(`--color-trade-long` / `--color-trade-short`)만 사용하세요.

### 1-2. 폰트 스택이 다릅니다

| | 목업 | 제품 |
|---|---|---|
| 본문/디스플레이 | Archivo, Public Sans | `--font-sans: 'Pretendard Variable','IBM Plex Sans',…` |
| 데이터/모노 | JetBrains Mono | `--font-mono: 'IBM Plex Mono','JetBrains Mono',…` |

목업의 Google Fonts 링크(`Archivo`·`Public Sans`)를 그대로 넣으면 제품에 **불필요한 웹폰트 3종**이 추가됩니다.
→ 목업에서 `<link href="...fonts.googleapis.com...">` 블록을 **삭제**하고 제품 토큰을 쓰세요.

### 1-3. 레이아웃 체계가 다릅니다

| | 목업 | 제품 |
|---|---|---|
| 컨테이너 | `--shell: 1280px`, `--gut: 34px` | `--grid-cols: 24`, `--grid-gap: 6px` |
| 헤더 | 자체 `.nav` (72px) | `--header-h: 48px` |
| 밀도 | 없음 | `--density-scale` (comfortable/compact/dense) |

→ 목업의 `--shell`/`--gut`/`.nav`를 버리고 제품의 24열 그리드와 48px 헤더를 쓰세요.

---

## 2. 토큰 매핑표 (목업 → 제품)

| 목업 변수 | 제품 토큰 | 비고 |
|---|---|---|
| `--mag` `#F00FF0` | `--color-brand` | PR #2 머지 후 |
| `--violet` `#7C5CFF` | `--color-ai` | AI 계열 |
| `--cyan` `#3BE8FF` | **삭제** | 제품에 대응 없음 |
| `--up` `#25D07A` | `--color-trade-long` | **색이 다름 (1-1 참고)** |
| `--dn` `#FF4D6A` | `--color-trade-short` | **색이 다름 (1-1 참고)** |
| `--bone` `#F2F3F7` | `--color-text-primary` | |
| `--steel` `#A7AEBD` | `--color-text-secondary` | |
| `--slate` `#7A8292` | `--color-text-tertiary` | |
| `--dim` `#7E879A` | `--color-text-tertiary` | 제품 값 사용 |
| `--void` `#07070B` | `--color-bg-app` | |
| `--void-2` `#0B0B12` | `--color-bg-surface` | |
| `--panel` / `--panel-2` | `--color-bg-panel` / `--color-bg-elevated` | |
| `--edge` / `--edge-2` | `--color-border-subtle` / `--color-border-default` | |
| `--font-display` `--font-body` | `--font-sans` | 1-2 참고 |
| `--font-mono` | `--font-mono` | 1-2 참고 |
| `--shell` / `--gut` | `--grid-cols: 24` 체계 | 1-3 참고 |
| `--r-md` 10px 등 | `--r-sm/md/lg/xl` (4/6/8/12px) | 반경 값 다름, 제품 값 사용 |

**원칙: 목업에서 값을 복사하지 말고, 제품 토큰 이름을 참조하세요.** 그래야 테마·밀도 전환이 살아납니다.

---

## 3. 화면별 매핑 (내 페이지 → 제품 CSS)

제품 CSS는 `packages/design-tokens/src/`에 있고, `all.css` 하나로 import됩니다.

| 목업 페이지 | 제품에서 대응 | 사용할 제품 클래스 |
|---|---|---|
| `login.html` `signup.html` `reset.html` | 인증 화면 | `.auth-shell`, `.auth-shell__form`, `.auth-form`, `.auth-progress__step`, `.pw-strength`, `.auth-alert` |
| `index.html` `guide.html` `partner.html` `billing.html` | 랜딩/마케팅 | `.landing-*`, `pages-auth.css` 하단 블록 |
| `app.html` `trade.html` `ts-*.html` | 터미널 | `widgets.css` + `pages.css` (KPI/섹션/테이블) |
| `terms/privacy/risk/refund/legal.html` | 법적 문서 | 제품에 대응 클래스 없음 → **신규 작성 필요** |
| `indicators-v2.html` | 지표 라이브러리 | 제품에 대응 없음 → 신규 |

> **주의:** `apps/broker-web`(AGENTS.md가 언급하는 신규 프론트엔드)이 이 체크아웃에 **없습니다**(`apps/`에는 `api`·`market-gateway`만). 다른 체크아웃·브랜치에서 작업 중이라면 그쪽 기준으로 클래스명을 다시 확인하세요.

---

## 4. 이식 순서 (권장)

1. **PR #2 머지** → 제품 브랜드가 마젠타가 됨
2. `packages/design-tokens/src/pages-auth.css` 등에서 **목업의 레이아웃 구조만** 참고 (토큰은 제품 것 사용)
3. 인증 화면(login/signup/reset)부터 이식 — 제품에 클래스가 이미 있어 가장 안전
4. 터미널 화면 이식 — **롱/숏 색을 제품 토큰으로 반드시 교체**
5. 법적 문서·지표 화면은 신규 컴포넌트로 작성
6. **PR #3 머지** → 지표 v2 연결(`chart-kline.jsx` 연동은 별도 작업)

---

## 5. 이식 후 검증 체크리스트

- [ ] 목업의 Google Fonts `<link>` 3종이 제거되었는가
- [ ] 캔들·PnL·포지션 배지가 **틸/마젠타**(제품 값)인가, 그린/레드가 아닌가
- [ ] 다크/라이트 전환 시 차트 색이 함께 바뀌는가
- [ ] 밀도 전환(comfortable/compact/dense) 시 행 높이가 변하는가
- [ ] `--shell`/`--gut`/`.nav` 잔여물이 남아 있지 않은가
- [ ] 브랜드 색이 `#F00FF0`(라이트에서는 `#922391`)인가
- [ ] `pnpm -r typecheck && pnpm build` 통과

---

## 6. 아직 해결되지 않은 것 (이식자가 알아야 함)

| 항목 | 상태 |
|---|---|
| `indicators-v2` 하단 빈 공간 | 부분 개선, 완전 해소 아님 (카탈로그 2단 분할 재설계 필요) |
| `trade-system` AI READ 패널 값 | Entry/Invalidation/Target 값이 비어 보임 — 목업 데이터 누락 의심 |
| 지표 3종 `ASI`·`KLINGER`·`VCTC` | 미이관 (정의 미확정) |
| 근사 지표 5종 | `CRSI`·`RVIMOM`·`RVIVOL`·`CZ`·`MASSINDEX` 교과서 대조 미완 |
| 색상 근접 ①/②/③ | 미확정 (현재 ① 그대로 유지로 적용) |
| 법무 문서 플레이스홀더 | 사업자 정보·국외이전 수탁사 미채움 |
| 특금법 VASP 신고 대상 여부 | 변호사 검토 필요 (최대 리스크) |

---

## 7. 참고 — 목업의 위치

- 샌드박스: `cc-sandbox/` (31 HTML + `variants/` 6종 + `qt-indicators-next.js`)
- 렌더 확인: 홈 · 터미널 · 옵션 보드 · 브랜드 토큰 · 지표 v2
- **목업은 프로덕션 코드가 아닙니다.** 시각·구조 참고용이며, 토큰은 반드시 제품 것을 쓰세요.
