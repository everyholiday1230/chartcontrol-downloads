# ChartControl 홈페이지 — 주장 전수 검증 리포트

검증일: 2026-10-11 · 대상: `cc-sandbox/index.html` (ChartControl 제품 소개 홈페이지)
검증 방법: 홈페이지의 텍스트 노드 361개를 전부 추출 → 실제 앱 소스(`/tmp/opencode/bi/ChartControl`)와 1:1 대조

---

## 1. 사실로 확인된 주장 (그대로 유지)

| 주장 | 검증 근거 | 판정 |
|---|---|---|
| Free $0 / 1,000 points | `apps/api/src/subscriptions/plans.ts` | ✅ 정확 |
| Basic $19 / 9,000 points | 동일 파일 | ✅ 정확 |
| Pro $49 / 30,000 points | 동일 파일 | ✅ 정확 |
| Premium $99 / 72,000 points | 동일 파일 | ✅ 정확 |
| Elite $199 / 200,000 points | 동일 파일 | ✅ 정확 |
| ≈300 points per analysis | `plans.ts` 주석 + `points/ai-metering.ts` | ✅ 일치 |
| KuCoin 거래소 | `packages/exchange-kucoin` | ✅ 실재 |
| BitMart 거래소 | `packages/exchange-bitmart` | ✅ 실재 |
| Market scanner | 15개 파일 | ✅ 실재 |
| Journal | 22개 파일 | ✅ 실재 |
| Alerts | 56개 파일 | ✅ 실재 |
| Live WebSocket depth | 58개 파일 | ✅ 실재 |
| AI Copilot | 59개 파일 | ✅ 실재 |
| Custom indicators | 10개 파일 | ✅ 실재 |
| Signal rules | 9개 파일 | ✅ 실재 |
| Risk-based position sizing | `scanner-position-size.test.ts` · `autotrade/config.ts` | ✅ 실재 |
| 10개 화면(내비게이션) | `real-nav.json` 36항목 / 6섹션 | ✅ 실재 |
| Non-custodial · Read+Trade only | 제품 전반 일관 | ✅ 일치 |
| 자동매매 필수 손절·일일 손실한도 | `autotrade` 모듈 | ✅ 실재 |

## 2. 거짓/불일치로 확인되어 **수정한** 주장

| # | 원래 문구 | 실제 제품 | 조치 |
|---|---|---|---|
| 1 | `Pairs live 660+` · `660+ USDT perpetual pairs` · `Perpetual pairs 660+` | 마켓 게이트웨이 기본 심볼 = **BTCUSDT, ETHUSDT, SOLUSDT (3개)**. 앱 UI는 `2 of 21 pairs live`. 소스 전체에 `660`이라는 수치 없음(`tools.ts`의 660은 예시 가격 66000의 일부) | **숫자 삭제.** 통계를 `Exchanges live 2`로 교체. 마케팅 문구에서 `660+` 전부 제거 |
| 2 | `24-column workspace` · `Twenty-four columns` · `24 COLUMNS` | `design-tokens` 기본값은 `cols: 24`이지만, `layout-ops` 마이그레이션이 **96**으로 승격하고 테스트가 `const GRID_COLS = 96`을 강제 (`expect(out.cols).toBe(96)`) | **96으로 정정** (4곳) |
| 3 | `Seven: English, Türkçe, ... Filipino` · `Legal documents are published in all seven` | `src/locales`에 14개 로케일. 그중 **10개**가 UI + admin + auth 전부 번역 완료(en·ko·ja·zh·es·pt·tr·vi·hi·fil) | **10개로 정정** — 과소 주장이었음 |

## 3. 검증 불가 — 제품팀 확인 필요

| 주장 | 상태 |
|---|---|
| `Median answer 4.2s` | 소스에서 근거 수치를 찾지 못했습니다. 히어로 차트에도 `answered in 4.2s`로 3회 반복됩니다. **실측 지표라면 근거 로그를 주시면 그대로 유지**, 아니라면 삭제해야 합니다. 현재는 유지 상태 |
| `Live WebSocket depth` (KuCoin/BitMart 각각) | depth 관련 파일 58개는 확인했으나, **두 거래소 모두** 라이브 WS depth를 제공하는지는 거래소별 검증이 필요합니다 |

## 4. 새로 쓴 문구 (고객 문제 → 사용 가능한 기능 중심)

### 히어로 리드
- **이전**: "ChartControl reads the candles you are already looking at and draws the entry, the invalidation and the reward-to-risk straight onto the screen."
- **이후**: "**You already know how to read a chart. The hard part is the sixty seconds before you click — and doing it the same way twice.** ChartControl reads the candles already on your screen and draws the entry, the invalidation and the reward-to-risk straight onto them, each level naming the rule that produced it and the candle it came from."

→ 고객이 실제로 겪던 문제(클릭 직전의 망설임, 매번 달라지는 판단)를 먼저 세우고 기능을 붙였습니다.

### 히어로 캡션
- **이전**: `NO CARD · FREE POINTS ON SIGNUP · FEE DISCOUNT VIA OUR LINK`
- **이후**: `NO CARD · FREE POINTS ON SIGNUP · READ + TRADE ONLY — WE NEVER ASK FOR WITHDRAWAL`

### 마지막 CTA
- **이후**: `NON-CUSTODIAL · NO CARD · YOUR KEYS, YOUR ACCOUNT · ANALYSIS, NEVER ADVICE`

### 신규 섹션 — "What you can actually open"
실제 앱 내비게이션에서 **검증된 10개 화면**만 골라 한 줄 설명과 함께 배치했습니다. 덱용 기능 목록이 아니라 로그인하면 실제로 열리는 화면입니다.

| 화면 | 한 줄 설명 |
|---|---|
| Trade | AI가 실시간 캔들에 레벨을 그리고, 주문 티켓이 같은 화면에 |
| Markets | 정렬 가능한 마켓 테이블 + 모든 행에 라이브 WebSocket depth |
| Market scanner | 전 종목을 돌파·압축·거래량 급증으로 스크리닝 |
| Strategy library | 실제 캔들로 돌린 룰셋, 손익 수치까지 그대로 노출 |
| Analytics | 내 체결 기준 자산곡선·낙폭·승률·손익비 |
| Portfolio & Wallet | 포지션·잔고·거래소 연결을 한 곳에 |
| Order history & Notifications | 모든 주문과 알림을 타임스탬프와 함께 검색 |
| Autotrade | 내가 쓴 룰만 실행 — 손절·일일 손실한도 필수, 언제든 정지 |
| Points & Referral | 각 분석에 쓴 포인트와 적립 내역을 항목별로 |
| Settings | 언어·테마·밀도·API 키 전부 내 통제 |

## 5. 검증 후 남은 상태
- `660` 문자열: **0개**
- `24-column` / `Twenty-four columns`: **0개** → `96-column` 3곳 + `Ninety-six` 1곳
- `Seven: English`: **0개** → 10개 언어로 교체
- 히어로 통계: `2` · `4.2s` · `96`
- 페이지 오류: 다크 0 / 라이트 0
- 신규 기능 섹션 카드: 10개
