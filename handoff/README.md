# ChartControl 디자인 산출물 — 이식용 핸드오프

대표님께 첨부로 전달된 디자인 시안/목업 원본입니다.
이 저장소는 그 파일들을 **다른 작업자가 직접 내려받아 쓸 수 있게** 올린 것입니다.

## 먼저 읽을 것

**`transplant-contract.md`** — 목업을 실제 제품에 옮길 때의 규칙 문서입니다.
가장 먼저 읽어주세요. 핵심은 §1(절대 그대로 옮기면 안 되는 것 3가지)과 §2(토큰 매핑표)입니다.

## 구성

```
pages/                  36개 HTML (제품 토큰 기준으로 리팩터된 최신본)
  index.html            홈
  app.html              트레이딩 터미널
  guide.html            가이드
  login/signup/reset    인증 3종
  billing.html          결제·요금제
  partner.html          파트너 프로그램
  terms/privacy/risk/refund/legal   법적 문서 5종
  options.html          디자인 옵션 A~H 보드
  status.html           작업 현황
  brand-tokens.html     브랜드 토큰 프리뷰
  trade*.html           트레이드 탭 4종
  ts-*.html             트윅스 데모 8종
  indicators*.html      지표 라이브러리 v1 / v2
  variants/             배경효과 적용 변형 6종 (A/C/E/G/H/ACG)
transplant-contract.md   이식 계약서 (토큰 매핑표 + 검증 체크리스트)
tokens-brand-chartcontrol.css   적용된 tokens.css 전체 사본
brand-f00ff0-token-unification.patch   PR 커밋 diff
chartcontrol-site.zip    이전 버전 배포용 ZIP (참고용, 리팩터 이전)
```

## 중요 — 이 파일들의 성격

1. **프로덕션 코드가 아닙니다.** 시각·구조 참고용 목업이며, 토큰은 반드시 제품 것을 쓰세요.
2. **롱/숏 색이 제품과 같아졌습니다.** 이 리팩터본은 제품과 동일하게 **틸(롱)/마젠타(숏)** 입니다. 이전 목업의 그린/레드 기준으로 보면 다르게 보이는 게 정상입니다.
3. **제품 토큰 브리지가 주입돼 있습니다.** 각 HTML의 `<head>`에 3개 레이어가 있습니다:
   - `product-tokens` — 제품 `tokens.css`의 `:root` 블록
   - `product-bridge` — 목업 변수 → 제품 토큰 연결
   - `brand-pin` — 잔여 시안 제거 + `.btn-mag` 고정 (`!important` 포함, 이식 시 제거 대상)
4. **폰트 CDN 2개를 로드합니다** (Pretendard, IBM Plex). 제품은 자체 폰트를 쓰므로 이식 시 `<link>`는 버리세요.
5. **레이아웃은 미변환입니다.** `--shell`/`--gut`/`.nav` 구조는 목업 것을 유지했습니다. 제품의 24열 그리드 + 48px 헤더로 바꾸는 것은 이식 단계 작업입니다.

## 브랜드 색

- 공식 브랜드: `#F00FF0` = `oklch(67.25% 0.3048 328.33)`
- 라이트 테마 텍스트용: `oklch(48% 0.190 328.33)` (`#922391`, 6.41:1)
- CTA 라벨: 브랜드 면 위에는 **어두운 라벨**(`--color-text-inverse`). 흰 라벨은 3.48:1로 AA 미달입니다.

## 알려진 미해결 항목

| 항목 | 상태 |
|---|---|
| `indicators-v2` 하단 여백 | 부분 개선, 완전 해소 아님 |
| 지표 3종 `ASI`/`KLINGER`/`VCTC` | 미이관 (정의 미확정) |
| 근사 지표 5종 | `CRSI`/`RVIMOM`/`RVIVOL`/`CZ`/`MASSINDEX` 교과서 대조 미완 |
| 법무 문서 플레이스홀더 | 사업자 정보 5개, 국외이전 수탁사 미채움 |
| 특금법 VASP 신고 대상 여부 | 변호사 검토 필요 |
| 색상 근접 | 브랜드 마젠타(328.3°) vs 숏(355°) = 26.7° — 유지로 적용됨, 미확정 |
