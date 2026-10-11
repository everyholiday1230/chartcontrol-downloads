# ChartControl — 목업 vs 실제 제품 전면 대조 (2026-10-11)

**방법**: `BEOMONNURI-Innovation/ChartControl` 을 로컬 실행(`DATA_MODE=MOCK_REPLAY TRADING_MODE=MOCK`) →
Playwright 로 실제 계정 생성 → DB 에서 `role='super'` 로 승격 → **로그인 세션으로 39개 화면 전부 캡처** →
`getComputedStyle` 로 토큰 323개 추출 → 소스의 `SIDEBAR_ITEMS` 레지스트리와 대조.

---

## 0. 대표님 질문에 대한 답

### Q. "랜딩이라면 홈페이지 다시 제작한건가? https://8080-…/# 여기?"
**아닙니다.** 그 주소(8080)는 **제가 만든 옛 목업**을 서빙하는 제 샌드박스입니다.

```
8080 → <html lang="en" data-theme="dark">   ← 제 옛 목업 (다크 마젠타)
8787 → 실제 ChartControl 앱 (라이트 테마)
```

8080 의 `<title>` 은 `ChartControl — Ask the chart. It marks the answer.` — **제가 지어낸 카피**입니다.
실제 랜딩의 헤드라인은 `Stop squinting at charts. Just ask. The AI marks it on screen.` 입니다.
**8080 은 실제 홈페이지가 아닙니다. 무시하십시오.**

### Q. "왼쪽 탭이 접혀져 있어서 더 많을 것"
**맞습니다.** 접힌 레일에는 고정 4개만 보입니다. 펼치면 훨씬 많습니다. 소스 레지스트리 기준 **36개 항목 / 6개 섹션**입니다. 아래 §1 참조.

---

## 1. 실제 전체 탭 — 전수 (소스 레지스트리 + 라이브 확인)

### 라이브 사이드바 (super 계정, 펼친 상태)
| 섹션 | 항목 |
|---|---|
| **TRADING** | Trade ★ |
| **MARKETS** | Markets ★ · Market scanner ★ · Strategy library · Auto trading `ADMIN` · Analytics |
| **ACCOUNT** | Leaderboard `ADMIN` · Portfolio ★ · Wallet ★ · Order History · Notifications · Referral · Points · Settings · Help |
| **OPERATIONS** `OPS` | Admin Home `OPS` · Fees & Rebates · Users `OPS` · Trade Monitor `ADMIN` · Notices & CS `OPS` |
| **TOOLS** | Edit layout · Tweaks |

하단 문구: `Star a menu to keep it in the collapsed rail. Pinned: 4`

### 소스 레지스트리 전체 (`SIDEBAR_ITEMS`, 36개)
**일반 사용자 노출 (13~16개)**
`/trade` · `/markets` · `/ai-strategies/my`(운영자만) · `/scanner` · `/strategy-library` · `/autotrade`(관리자만) · `/analytics` · `/leaderboard`(관리자만) · `/portfolio` · `/wallet` · `/order-history` · `/notifications` · `/referral` · `/points` · `/settings` · `/help`

**운영자/관리자 전용 (20개)**
`/admin` · `/fees` · `/admin/users` · `/admin/trades` · `/admin/risk` · `/admin/deposits` · `/admin/withdrawals` · `/admin/assets` · `/admin/ai-ops` · `/admin/fees` · `/admin/notices` · `/admin/broadcast` · `/admin/referral` · `/admin/points` · `/admin/legal` · `/admin/autotrade` · `/admin/activity` · `/admin/system` · `/admin/audit` · `/admin/design-ops`(super 전용)

**섹션 정의**: `trading`(Trading) · `market`(Markets) · `account`(Account) · `ops`(Operations) · `admin`(Admin) · `super`(Owner)

### 라우트는 있는데 메뉴에 없는 것 (의도된 숨김 — 소스 주석에 근거 명시)
- `/ai-strategies`, `/ai-strategies/detail` — 사이드바에서 내림
- `/wallet/transactions` — 하위 라우트
- `/trade?workspace=ai` — AI Workspace 는 **별도 화면이 아니라 거래 화면의 레이아웃 프리셋**
- 멀티차트 탭 — **삭제됨. 거래 화면 안 `Charts: Single/2/2×2/3×2` 로 흡수**
- `/leaderboard` — 2026-10-01 대표 지시로 상시 노출 (현재는 관리자만, 소스 주석에 이력)

### DB 테이블 43+ (기능 규모의 실증)
`orders` `order_intents` `order_events` `executions` `positions` `position_snapshots` `account_balances` `risk_checks`
`reconciliation_runs` `exchange_websocket_sessions` `idempotency_records` `trading_kill_switches`
`ai_runs` `ai_tool_calls` `ai_tool_outputs` `chart_commands` `ai_prompt_versions` `ai_evaluation_runs` `ai_feedback` `ai_policy` `ai_conversations` `ai_messages` `ai_signals`
`strategy_backtests` `strategy_follows` `user_strategies` `trade_journal` `layouts` `layout_versions` `chart_overlays`
`mfa_credentials` `mfa_challenges` `account_lockouts` `exchange_credentials` `trading_policies`
`feature_flags` `kill_switches` `incidents` `release_gates` `admin_actions` `admin_reports` `campaign_pnl` …

---

## 2. 제 목업에만 있고 실제에 **없는** 기능 (지어낸 것)

| 제 목업 | 실제 | 판정 |
|---|---|---|
| `billing.html` — 요금제/결제 화면 | **없음.** `/fees` 는 관리자 전용 수수료·리베이트. 셀프 결제 화면 없음 | **지어냄** |
| `partner.html` — 파트너 프로그램 | **없음.** `/referral`(친구 초대)만 존재 | **지어냄** |
| `status.html` — 공개 서비스 상태 페이지 | **없음.** `/admin/system`(관리자 전용)만 | **지어냄** |
| `guide.html` — 별도 가이드 | `/help` 로 통합 | **중복 지어냄** |
| `legal.html` — 법무 페이지 | 실제는 `/company`(사업자 정보) | **라우트 불일치** |
| 다크 마젠타 전면 테마 | **라이트가 기본** | **방향 오류** |
| `660+ markets` | 랜딩 `2 MARKETS YOU CAN CHART` · 앱 `2 of 21 pairs live` | **수치 오류** |
| `24-column layout` | 실제 `96-col Layout` | **수치 오류** |
| "Ask the chart. It marks the answer." | "Stop squinting at charts. Just ask. The AI marks it on screen." | **카피 오류** |
| Archivo / Public Sans | **Pretendard Variable + IBM Plex Sans** | **폰트 오류** |
| 매수=마젠타, 매도=빨강 | 매수=**틸** `oklch(52.1% 0.099 175)`, 매도=**마젠타 아웃라인** | **색 오류** |

> `options.html` · `brand-tokens.html` 은 제작 과정용 내부 산출물입니다. 제품 페이지로 오해하면 안 됩니다.

---

## 3. 실제에 있는데 제 목업에 **없는** 기능 (누락)

### 3-1. AI 코파일럿 — 실제 제품의 중심인데 제 목업에는 없음
거래 화면 우측에 상시 패널로 떠 있습니다.
- 탭 4개: **AI Chart Analysis · My AI Strategies · Position Review · Market Scanner**
- 빠른 실행: **Analyze this chart · Entry scenario · Find support & resistance · Draw ascending trendline · R/R calculator**
- 명령 입력: `Enter a command… (e.g. draw trendline / draft my setup / find S/R)`
- **MY ANALYSIS LAYERS** (AI 가 그린 레이어 관리)
- 과금 고지: `Points are used only when you send a question (300 per question, half if nothing is drawn)`
- 면책: `Analysis assistance — not investment advice. No profit is guaranteed. You place every order yourself.`
- 모델 미연결 시 정직한 거절: *"AI analysis is not connected yet, so I will not produce price levels. Doing so without a model would mean inventing entry and stop numbers."*

### 3-2. Auto trading (모의) — 없음
`PAPER Phase 1 runs on your paper (simulated) account only — no real orders are sent to the exchange. Safety limits: max 3 positions per strategy, max 50 orders a day, auto-stop at your daily loss limit.`
- **Build a strategy by talking to CCAI** → `Build with CCAI` 버튼
- 프리셋: `RSI back above 30` `EMA 20/50 cross` `20-bar breakout` `MACD cross`
- 입력: Name · Symbol · Timeframe · Direction · Entry condition · Exit condition
- 리스크: Stop loss · Take profit · Position size · Leverage · Max positions · Max orders/day · **Daily loss limit %**
- `Backtest` / `Create strategy` / `My strategies`
- 브라우저 알림 토글

### 3-3. Strategy library — 없음
12종 이상의 기성 규칙 카드. 각 카드에 `LONG`/`SHORT` 뱃지, 타임프레임, EMA/RSI 조건식 원문, 손절·익절, 그리고 **`Backtest` `Show on chart` `Auto-trade this`** 3버튼.
예: `Uptrend pullback` `Downtrend rally short` `20-bar breakout` `20-bar breakdown` `Golden cross` `Death cross` `RSI oversold bounce` `RSI overbought fade` `MACD cross with trend` `Bollinger lower-band rebound` `Volume spike momentum` `RSI bullish divergence`
헤더: `Ready-made rules — backtest any coin, show the signals on your chart, or start from them.`

### 3-4. Market scanner — 없음
`Run a signal…`

### 3-5. 거래 화면 자체가 제 목업과 다름
- 좌: **Market Watch** (검색 · All/Favorites/Meme · Stock Index/Metals · PAIR/Price/Vol/24h)
- 중: **CHART** — `Charts: Single / 2 / 2×2 / 3×2` · 타임프레임 1m~1M · `Indicators▾` · `Compare` · `Templates` · `✦ AI Chart Analysis` · 좌측 드로잉 툴 레일
- 우: **Order Entry** — `Margin Cross` / `Limit·Market·Trigger` / Price·Margin·Size / `▶ Buy Long` `▶ Sell Short` / `Reduce Only` `Post Only` `TP/SL` / Order Value·Required Margin·Est. Fee·Est. Liq. Price·Avail. After Order
- 우하: **Assets & Risk** — Equity · Unrealized · Available · Wallet · Used Margin · Maint. Margin · Margin Ratio · `Safe`/`Liquidation`
- 하단 탭: **Positions · Open Orders · Order History · Trade History · Transactions · ✦ AI Signals** + `This symbol only` / `Cancel all orders`
- 표 컬럼: `SYMBOL SIDE SIZE ENTRY MARK LIQ. PRICE MARGIN PNL (ROE) TP / SL ACTIONS`
- 빈 상태 카피: `Connect an exchange API key to see this. Nothing is shown until then — we do not fill the table with sample rows.`

### 3-6. 그 외 누락
- Points 경제 (AI 질문 300 포인트) · Referral · Leaderboard · Analytics(트레이드 저널) · Notifications · Wallet(API 키 관리) · Order History
- Spot / Futures / Paper 모드 전환 · 거래소 3사(KuCoin·Bybit·Bitget) · `Link` 버튼 · 알림
- 밀도(`comfortable/compact/dense`) · 테마 · 브랜드 5종 · 롱숏 팔레트 4종 전환
- `Tweaks` 패널 · `Edit layout` · 레이아웃 프리셋 · 즐겨찾기 고정
- 운영 콘솔 20개 화면 (Admin Home·Users·Trade Monitor·Risk Queue·Deposits·Withdrawals·Assets Vault·AI Ops·Notices·Broadcast·Referral Ops·Points·Legal·Auto-trade·Activity·System Health·Audit Log·Design Ops)
- 실시간 게이트웨이(`/ws`) · 킬 스위치 · 이상거래 · 정산(reconciliation) · 멱등성 · MFA · 계정 잠금

---

## 4. 결론

| | 제 목업 | 실제 제품 |
|---|---|---|
| 테마 | 다크 마젠타 | **라이트** (마젠타는 로고·포인트) |
| 폰트 | Archivo/Public Sans | **Pretendard Variable + IBM Plex Sans** |
| 화면 수 | 31 (대부분 마케팅) | **36 탭 + 운영 콘솔 20 + AI 코파일럿** |
| 기능 | 마케팅 카피 | **실거래·백테스트·자동매매·AI·포인트·운영** |
| 매수/매도 | 마젠타/빨강 | **틸 / 마젠타 아웃라인** |

**제 목업은 실제 제품의 기능을 하나도 담지 못했습니다.** 마케팅 페이지 몇 장과 상상으로 그린 차트 화면이 전부입니다. 재디자인은 "색만 바꾸는 일"이 아니라 **실제 36개 화면을 실측 디자인 시스템 위에서 다시 그리는 일**입니다.

### 재디자인에 쓸 확정 근거 (실측)
```
data-theme="light" · data-brand="chartcontrol" · data-density="comfortable" · data-longshort="teal-magenta"
배경      oklch(98% 0.003 240)      헤더      oklch(100% 0 0) · 48px · 하단 1px 보더
패널      oklch(99% 0.002 240) · 반경 6px    표        12px
본문      13px · Pretendard Variable  버튼      40px · 반경 4px · 14px/600
매수      oklch(52.1% 0.099 175)   매도      oklch(56.1% 0.200 355) (아웃라인)
브랜드    oklch(48% 0.190 328.33)  AI        oklch(55.1% 0.190 285)
차트 팔레트 21종 · 그림자 3종 · 뉴트럴 14단계 — 전부 실측값 그대로
```
