# ChartControl 실제 제품 디자인 시스템 — 실측 (2026-10-11)

**출처**: `BEOMONNURI-Innovation/ChartControl` 을 로컬 실행(`DATA_MODE=MOCK_REPLAY TRADING_MODE=MOCK`)한 뒤,
Playwright 로 실제 계정을 생성·로그인하여 `getComputedStyle` 로 뽑은 값. 1600×1000, `deviceScaleFactor: 1`.

> 이전 작업의 근거였던 `repos/chart-control`(2026-09-24 정지 사본)과 **다릅니다.** 아래는 운영 저장소 최신 코드 기준입니다.

---

## 0. 핵심 정정

| 항목 | 이전 가정 (폐기) | 실제 (실측) |
|---|---|---|
| 제품 테마 | 다크가 기본 | **`data-theme="light"` 가 기본** |
| 배경 | `#07070B` 근사 다크 | `oklch(98% 0.003 240)` — 아주 옅은 청회색 라이트 |
| 헤더 | 다크 | **`oklch(100% 0 0)` 순백, 높이 48px** |
| 브랜드 | 마젠타가 UI 전면 | 마젠타는 **포인트/로고/숏 포지션**에만 |
| 롱(매수) | 마젠타 | **틸-그린 `oklch(52.1% 0.099 175)`** |
| 숏(매도) | 빨강 | **마젠타 `oklch(56.1% 0.200 355)`** (아웃라인 버튼) |
| 폰트 | Archivo / Public Sans | **Pretendard Variable** + IBM Plex Sans |
| 기본 글자 | 14~16px | **13px** (표 12px) |

**`data-longshort="teal-magenta"` 가 기본값**입니다. 즉 브랜드 마젠타와 숏 마젠타가 **같은 계열**을 쓰는 것이 의도된 설계입니다.

---

## 1. `<html>` 속성 (실측)

```
data-theme   = "light"
data-brand   = "chartcontrol"
data-density = "comfortable"
data-longshort = "teal-magenta"
lang         = "en-US"
```

교체 가능한 축(실측 토큰 블록 존재):

- `data-theme` → `light` / (dark 는 `:root` 기본값)
- `data-brand` → `chartcontrol` / `institutional-cool` / `quantum-violet` / `onyx-emerald` / `graphite-amber`
- `data-density` → `comfortable` / `compact` / `dense`
- `data-longshort` → `teal-magenta` / `green-red` / `cyan-orange` / `red-blue`
- `data-a11y-high-contrast`, `data-a11y-color-blind`

토큰 총계: **323개** (16개 선택자 블록)

---

## 2. 핵심 토큰 — 라이트 테마 (`[data-theme="light"]`, 41개)

### 표면 / 텍스트
| 토큰 | 값 |
|---|---|
| `--color-bg-app` | `oklch(98% 0.003 240)` |
| `--color-bg-surface` | `oklch(100% 0 0)` |
| `--color-bg-panel` | `oklch(99% 0.002 240)` |
| `--color-bg-elevated` | `oklch(100% 0 0)` |
| `--color-bg-hover` | `oklch(94% 0.006 240)` |
| `--color-bg-active` | `oklch(90% 0.008 240)` |
| `--color-bg-input` | `oklch(100% 0 0)` |
| `--color-text-primary` | `oklch(20% 0.014 240)` |
| `--color-text-secondary` | `oklch(38% 0.014 240)` |
| `--color-text-tertiary` | `oklch(48% 0.012 240)` |
| `--color-text-disabled` | `oklch(72% 0.008 240)` |
| `--color-text-inverse` | `oklch(98% 0.003 240)` |
| `--color-border-subtle` | `oklch(90% 0.006 240)` |
| `--color-border-default` | `oklch(82% 0.008 240)` |
| `--color-border-strong` | `oklch(68% 0.010 240)` |

### 브랜드 (라이트 전용 오버라이드 — `[data-brand="chartcontrol"][data-theme="light"]`)
| 토큰 | 값 |
|---|---|
| `--color-brand` | `oklch(48% 0.190 328.33)` |
| `--color-brand-hover` | `oklch(40% 0.190 328.33)` |
| `--color-brand-subtle` | `oklch(48% 0.190 328.33 / 0.12)` |

브랜드 스케일(전역, 328.33°): 50 `96% 0.030` · 100 `90% 0.060` · 200 `82% 0.120` · 300 `75% 0.200` · 400 `71% 0.260` · **500 `69% 0.3048` (=`#F00FF0`)** · 600 `56% 0.240` · 700 `46% 0.190` · 800 `34% 0.130` · 900 `24% 0.090`
`--brand-accent-500: oklch(71% 0.260 328.33)`

### 매매 방향
| 토큰 | 다크(전역) | 라이트 오버라이드 |
|---|---|---|
| `--trade-long-500` | `oklch(72% 0.14 175)` | `--color-trade-long` = `oklch(52.1% 0.099 175)` |
| `--trade-short-500` | `oklch(68% 0.22 355)` | `--color-trade-short` = `oklch(56.1% 0.200 355)` |
| `--trade-long-bg` | `oklch(72% 0.14 175 / 0.12)` | — |
| `--trade-short-bg` | `oklch(68% 0.22 355 / 0.12)` | — |

### AI / 신호 / 주문 상태
| 토큰 | 값 |
|---|---|
| `--ai-500` | `oklch(72% 0.15 285)` (라이트 `--color-ai` = `oklch(55.1% 0.190 285)`) |
| `--signal-draft` | `var(--ai-500)` |
| `--signal-approved` | `oklch(78% 0.14 145)` (라이트 `oklch(52.1% 0.150 145)`) |
| `--order-pending` | `oklch(80% 0.13 85)` (라이트 `oklch(54.1% 0.115 75)`) |
| `--order-filled` | `oklch(75% 0.13 145)` |
| `--order-canceled` | `oklch(60% 0.02 240)` |
| `--order-rejected` | `var(--trade-short-500)` |
| `--warning-500` | `oklch(80% 0.14 75)` |
| `--danger-500` | `oklch(64% 0.20 25)` |
| `--success-500` | `oklch(74% 0.14 150)` |
| `--info-500` | `oklch(66% 0.16 250)` |

### 뉴트럴 스케일 (hue 240 고정)
`--n-950 oklch(14% 0.012)` · `--n-925 17%` · `--n-900 20%` · `--n-850 24%` · `--n-800 28%` · `--n-700 38%` · `--n-600 48%` · `--n-500 66%` · `--n-400 68%` · `--n-300 78%` · `--n-200 86%` · `--n-100 92%` · `--n-050 97%` · `--n-000 100%`

### 차트 팔레트 (라이트)
| 토큰 | 값 |
|---|---|
| `--chart-grid` | `oklch(88% 0.006 240 / 0.7)` |
| `--chart-axis-text` | `oklch(48% 0.012 240)` |
| `--chart-crosshair` | `oklch(38% 0.014 240 / 0.5)` |
| `--chart-candle-up` | `oklch(52.1% 0.099 175)` |
| `--chart-candle-dn` | `oklch(56.1% 0.200 355)` |
| `--chart-ma-1` | `oklch(54.1% 0.115 75)` |
| `--chart-ma-2` | `oklch(55.1% 0.190 285)` |
| `--chart-ma-3` | `oklch(52.8% 0.106 230)` |
| `--chart-volume-up` | `oklch(39.3% 0.049 175 / 0.6)` |
| `--chart-volume-dn` | `oklch(42.7% 0.106 355 / 0.6)` |
| `--chart-line-1..8` | 328.33° / 175° / 250° / 75° / 285° / 200° / 145° / 355° |

### 그림자
`--shadow-1 0 1px 2px rgba(15,20,28,0.06)` · `--shadow-2 0 4px 12px rgba(15,20,28,0.08)` · `--shadow-3 0 12px 32px rgba(15,20,28,0.14)`

---

## 3. 실측 컴포넌트 값

| 요소 | 배경 | 글자 | 폰트/크기 | 반경 | 높이 |
|---|---|---|---|---|---|
| `body` | `oklch(98% 0.003 240)` | `oklch(20% 0.014 240)` | Pretendard Variable 13px / 400 | 0 | — |
| `header` | `oklch(100% 0 0)` | `oklch(20% 0.014 240)` | 13px | 0 | **48px** (padding `0 16px 0 12px`, 하단 보더 `oklch(90% 0.006 240)`) |
| 패널 | `oklch(99% 0.002 240)` | `oklch(20% 0.014 240)` | 13px | **6px** | 보더 `oklch(90% 0.006 240) 1px` |
| Buy Long 버튼 | `oklch(52.1% 0.099 175)` (틸) | `rgb(10,14,20)` | 14px / 600 | **4px** | **40px** |
| Sell Short 버튼 | `oklch(68% 0.22 355 / 0.12)` (마젠타 12%) | `oklch(56.1% 0.200 355)` | 14px / 600 | 4px | 40px (보더 `oklch(56.1% 0.2 355)`) |
| 표 | 투명 | `oklch(20% 0.014 240)` | **12px** / 400 | 0 | — |

폰트 스택: `"Pretendard Variable", "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif`

---

## 4. 트레이드 화면 구조 (실측 1600×1000)

```
┌─ 헤더 48px (순백) ────────────────────────────────────────────────┐
│ CCAI ChartControl AI │ [Spot][Futures][Paper] │ [KuCoin][Bybit] │  │
│ ▶YouTube ✈Telegram ✦KuCoin campaign ⚑Join KuCoin │ 🔔 ☀ ⤢ EN ● │  │
├─ 종목 바 ────────────────────────────────────────────────────────┤
│ BTC/USDT PERP ▲  Perpetual·USDT-margined·125×MAX │ 68,000.0      │
│   -3,504.02 (-5.45%) ≈ $68,000.00 │ MARK·INDEX·FUNDING·OI·24H… │  │
├──┬──────────────┬──────────────────────────┬────────────────────┤
│아│ Market Watch │ CHART [Single 2 2×2 3×2] │ Order Entry        │
│이│ 검색 / All   │ 1m 3m 5m 15m 30m 1H …    │ Margin Cross       │
│콘│ Favorites    │ Indicators▾ Compare      │ Limit│Market│Trigger│
│레│ Meme Stock   │ Templates │ ✦AI Chart     │ Price 68000 USDT   │
│일│ Index Metals │ Analysis                 │ Margin / Size      │
│  │              │ [캔들 차트 + MA + 거래량] │ Order Value / Fee  │
│  │ BTC 64,294.0 │                          │ ▶Buy Long ▶Sell Short│
│  │ ETH 3,619.0  │                          ├────────────────────┤
│  │              ├──────────────────────────┤ Assets & Risk      │
│  │              │ Positions│Open Orders│…  │ Equity 0.00        │
│  │              │ (빈 표 + "Connect a key")│ Margin Ratio 0.00% │
└──┴──────────────┴──────────────────────────┴────────────────────┘
```

- 헤더 좌: 로고 → `Spot / Futures / Paper` 세그먼트 → 거래소 `KuCoin / Bybit` → 외부링크 `YouTube / Telegram / KuCoin campaign / Join KuCoin` → 우측 아이콘 4개 + `EN` + 아바타
- 좌측 세로 아이콘 레일(접힌 사이드바) 존재
- 종목 바: 심볼 + `PERP` 뱃지 + `▲` + `Perpetual · USDT-margined · 125× MAX` / 대형 가격(마젠타) + 변동 + 마켓 통계 7종(`MARK PRICE` `INDEX PRICE` `FUNDING` `OPEN INTEREST` `24H HIGH` `24H LOW` `24H VOLUME`) / `Link` + 아이콘 4개
- 중앙: 차트 툴바(타임프레임 1m~1M, `Indicators▾`, `Compare`, `Templates`, `✦ AI Chart Analysis`) + 좌측 드로잉 툴 레일
- 하단 탭: `Positions` `Open Orders` `Order History` `Trade History` `Transactions` `✦ AI Signals` + `This symbol only` / `Cancel all orders`
- 하단 표 헤더: `SYMBOL SIDE SIZE ENTRY MARK LIQ. PRICE MARGIN PNL (ROE) TP / SL ACTIONS`
- 빈 상태: "Connect an exchange API key to see this. Nothing is shown until then — we do not fill the table with sample rows. **Connect a key →**"
- 우하: `Assets & Risk` — `Equity (USDT) 0.00` / `Unrealized` / `Available` `Wallet` / `Used Margin` `Maint. Margin` / `Margin Ratio` / `Safe` `Liquidation`
- 우하단 코너에 AI 어시스턴트 플로팅 버튼

---

## 5. 캡처한 실제 화면 17종

`app-trade` · `app-markets` · `app-ai-strategies` · `app-portfolio` · `app-analytics` · `app-scanner` ·
`app-strategy-library` · `app-settings` · `app-help` · `app-points` · `app-wallet` · `app-referral` ·
`app-leaderboard` · `app-order-history` · `app-autotrade` · `app-fees` · `app-notifications`

전부 **실제 로그인 세션**에서 캡처했습니다(1600×1000). 로그인 게이트 뒤 화면이 포함됩니다.

### 화면별 실제 탭/문구 (body innerText 실측)
- **trade** — `ChartControl AI Spot Futures Paper KuCoin Bybit YouTube Telegram KuCoin campaign Join KuCoin EN` … `★ BTC/USDT PERP ▲ Perpetual · USDT-margined · 125…`
- **markets** — `Home / Markets` · `2 of 21 pairs live · Perpe…`
- **ai-strategies** — `Home / My AI Strategies` · `AI-drive…`
- **portfolio** — `Home / Portfolio` · `Assets · Equity curve`
- **analytics** — `Home / Analytics` · `Trade journal · Perfor…`
- **scanner** — `Home / Market scanner` · `Run a signal…`
- **strategy-library** — `Home / Strategy library` · `Ready-ma…`
- **settings** — `Home / Settings` · `Profile · security · not…`
- **help** — `Home / Help` · `Help Center FAQ · guides · contact`
- **points** — `Home / Points` · `Used inside this app for AI …`
- **wallet** — `Home / Wallet` · `Supported exchanges · API ke…`
- **referral** — `Home / Referral` · `Refer a friend Invite friends and…`
- **order-history** — `Home / Order History` · `All orders · o…`
- **fees** — `Home / Settings / Fees & Rebates` · `Fees & Rebates M…`
- **notifications** — `Home / Notifications` · `0 unread · 0 t…`

> `leaderboard`·`autotrade` 는 좌측 내비 클릭 시 `/trade` 로 되돌아갔습니다(발주자 방침: 미완성 화면은 admin 등급만). 즉 이 두 화면은 **일반 사용자에게 노출되지 않는 것이 의도된 동작**입니다.

---

## 6. 마케팅 랜딩(별개) — 크림/테라코타

`ChartControl/index.html` (운영 `https://chartcontrol.onrender.com/index.html`)은 **앱과 다른 디자인 언어**입니다.

- 배경 크림 `#F4F1EA`, 텍스트 다크 브라운
- 악센트 테라코타/코랄
- 세리프 대형 헤드라인 + 산세리프 본문
- 헤드라인: "Stop squinting at charts. **Just ask.** The AI marks it on screen."
- 뱃지: `● AI CHART ANALYSIS SOFTWARE`
- CTA: `✦ Start for free` (다크 버튼)
- 지표: `2 MARKETS YOU CAN CHART` · `2 CHART DATA SOURCES` · `0 CUSTOMER FUNDS WE HOLD` · `0 WITHDRAWAL PERMISSIONS WE REQUEST`
- 상단 띠: "SOFTWARE, NOT A BROKER — WE ARE NOT AN EXCHANGE, A BROKER OR AN INVESTMENT ADVISER…"
- 내비: `Live market` `How it works` `Features` `Pricing` `Exchanges` + `Sign in` / `Create account`
- 다음 섹션: "Say it. See it on the chart."

**결론: 마케팅 = 크림/테라코타 라이트, 앱 = 라이트 + 마젠타/틸. 두 곳 모두 다크 마젠타가 아님.**

---

## 7. 재작업에 반영할 원칙

1. **다크 마젠타 전면 테마 폐기.** 앱은 라이트(`oklch(98% 0.003 240)`), 마케팅은 크림(`#F4F1EA`).
2. 마젠타(`#F00FF0` / 500)는 **로고·브랜드 포인트·숏 포지션**에만.
3. 매수 = 틸 `oklch(52.1% 0.099 175)`, 매도 = 마젠타 아웃라인. 이는 **제품 기본값**(`data-longshort="teal-magenta"`).
4. 폰트는 **Pretendard Variable + IBM Plex Sans** (Archivo/Public Sans 아님).
5. 기준 글자 13px / 표 12px / 헤더 48px / 패널 반경 6px / 버튼 40px·반경 4px.
6. 헤더는 **순백 + 하단 1px 보더**, 다크 바 아님.
7. 실제 화면 문구를 그대로 쓸 것 (예: `Connect an exchange API key to see this…`, `This symbol only`, `Cancel all orders`).
8. 라이트 테마 차트 팔레트(`--chart-*` 21종)를 그대로 사용 — 임의 색 금지.
