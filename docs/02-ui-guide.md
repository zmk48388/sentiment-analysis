# 02. UI 구현 지침

> 목표: 첨부된 참고 화면(파란 그라데이션 + 큰 둥근 카드 + 알약 버튼 + 유리 질감 도형)의 **분위기**를 감성 분석 화면으로 옮깁니다.
> 색상·크기·문구는 이 문서의 값을 그대로 사용하세요. 눈대중으로 바꾸지 마세요.

---

## 1. 참고 화면 분석 (무엇을 가져오고 무엇을 바꾸나)

참고 화면은 금융 서비스의 메인 배너입니다. 아래 표처럼 **스타일 요소만** 가져옵니다.

| 참고 화면의 요소 | 우리 화면에서의 적용 |
|---|---|
| 왼쪽→오른쪽으로 짙은 파랑에서 연한 하늘색으로 번지는 **그라데이션 배경** | 전체 히어로 영역 배경으로 사용 |
| 화면 전체를 감싸는 **매우 둥근 큰 카드**(모서리 약 40px) | 히어로 컨테이너 |
| 작은 소제목 + **굵고 큰 흰색 제목** | "감정은 글에 담기니까" + "마음이 궁금한 순간, 감성 분석" |
| **알약(pill) 모양 버튼** — 검정 채움, 흰색 채움, 오른쪽에 화살표 아이콘 | "분석하기"(검정), "지우기"(흰색) |
| 오른쪽의 **유리처럼 반투명한 둥근 사각형 도형 2개**가 겹침 | CSS로 만든 장식 도형 (3-4 참고) |
| 오른쪽 아래의 **흰색 카드**(왼쪽 위가 크게 둥글게 파임) + 안내 문구 + 작은 말풍선 | 예시 문장 카드 |
| 툴팁(검정 알약 말풍선) | "예시를 눌러보세요!" 말풍선 |

### 가져오지 않는 것 (중요)
- ❌ 참고 화면의 **브랜드 이름, 로고, 앱 아이콘, 은행 문구**("교보SBI저축은행", "사이다 Bank", "QR 코드" 등)
- ❌ 좌측 하단 작은 알림 칩 등 **서비스와 무관한 요소**
- ❌ 이미지 파일을 그대로 복사해서 배경으로 쓰는 것 (모든 장식은 CSS로 직접 구현)

---

## 2. 디자인 토큰 (CSS 변수)

`public/css/style.css` 맨 위 `:root`에 **아래 이름 그대로** 정의하고, 이후 모든 스타일은 이 변수를 사용합니다.

```css
:root {
  /* 색상 — 파랑 계열 (참고 화면에서 추출한 근사값) */
  --blue-700: #1D55E8;   /* 가장 짙은 파랑 (그라데이션 시작) */
  --blue-600: #2F6BFF;   /* 메인 파랑 */
  --blue-500: #4F8BFF;
  --blue-300: #9CC4FF;
  --blue-100: #CFE5FF;   /* 가장 연한 하늘색 (그라데이션 끝) */

  /* 중립 색상 */
  --ink-900: #0F172A;    /* 검정 버튼, 본문 강한 글자 */
  --ink-600: #475569;    /* 보조 글자 */
  --ink-300: #CBD5E1;    /* 테두리 */
  --white: #FFFFFF;

  /* 결과 색상 (글자색 / 배경색) */
  --positive: #0E8F5F;
  --positive-bg: #E3F7EE;
  --negative: #D93A44;
  --negative-bg: #FDE8EA;
  --neutral: #52627A;
  --neutral-bg: #E9EEF5;

  /* 오류 */
  --error: #B42318;
  --error-bg: #FEF0EE;

  /* 모양 */
  --radius-hero: 40px;
  --radius-card: 28px;
  --radius-pill: 999px;
  --shadow-card: 0 12px 40px rgba(29, 85, 232, 0.18);

  /* 글꼴 */
  --font: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont,
          'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
}
```

### 글꼴
`index.html`의 `<head>`에 아래 한 줄을 넣어 Pretendard를 불러옵니다. (허용된 유일한 외부 CDN)

```html
<link rel="stylesheet" as="style" crossorigin
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
```

글자 크기 규칙:

| 용도 | 데스크톱 | 모바일(640px 미만) | 굵기 |
|---|---|---|---|
| 소제목(eyebrow) | 18px | 15px | 400, 흰색 80% |
| 메인 제목(h1) | 40px | 28px | 700, 흰색 |
| 설명문 | 16px | 14px | 400, 흰색 85% |
| 버튼 | 15px | 15px | 700 |
| 결과 감성 단어 | 36px | 30px | 800 |
| 본문/분석 이유 | 16px | 15px | 400 |

---

## 3. 화면 구조

### 3-1. 전체 레이아웃 (데스크톱, 폭 1024px 이상)

```
┌──────────────────────────────────────────────────────────────┐  ← body 배경: 흰색(#FFFFFF)
│  ┌─ .hero (그라데이션, 둥근 40px, 바깥 여백 16px) ──────────┐ │
│  │                                                          │ │
│  │  감정은 글에 담기니까               ┌──────┐             │ │
│  │  마음이 궁금한 순간, 감성 분석      │ 유리  │ (장식 도형) │ │
│  │  설명문 한 줄                       │ 도형  │             │ │
│  │                                     └──────┘             │ │
│  │  ┌─ .analyzer (흰색 카드) ───────┐                       │ │
│  │  │ [ 입력창 (textarea)        ] │                       │ │
│  │  │ 0 / 500        [분석하기][지우기]                     │ │
│  │  └──────────────────────────────┘      ┌──────────────┐ │ │
│  │  ┌─ .result (흰색 카드) ─────────┐      │ 예시 문장 카드│ │ │
│  │  │ 감성 / 신뢰도 / 분석 이유     │      │ (오른쪽 아래) │ │ │
│  │  └──────────────────────────────┘      └──────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
│  저장 안내 문구 (작은 글씨)                                   │
└──────────────────────────────────────────────────────────────┘
```

- 히어로 최소 높이: 데스크톱 `640px`, 이후 내용에 따라 늘어남
- 콘텐츠 최대 폭: `1120px`, 가운데 정렬
- 왼쪽 영역(제목·입력·결과)은 폭 `560px` 이내, 오른쪽은 장식 도형과 예시 카드

### 3-2. HTML 구조 (id와 클래스 이름은 JS와 연결되므로 **정확히** 이 이름 사용)

```html
<body>
  <main class="hero">
    <div class="hero-inner">
      <section class="hero-copy">
        <p class="eyebrow">감정은 글에 담기니까</p>
        <h1 class="hero-title">마음이 궁금한 순간, 감성 분석</h1>
        <p class="hero-desc">문장을 입력하면 AI가 긍정·부정·중립을 읽어드려요.</p>

        <form id="analyze-form" class="analyzer" novalidate>
          <label for="text-input" class="sr-only">분석할 문장</label>
          <textarea id="text-input" name="text" rows="4" maxlength="500"
            placeholder="분석하고 싶은 문장을 입력해 주세요."></textarea>
          <div class="analyzer-footer">
            <span id="char-count" class="char-count">0 / 500</span>
            <div class="button-group">
              <button type="submit" id="submit-btn" class="btn btn-dark">
                <span class="btn-label">분석하기</span><span class="btn-icon" aria-hidden="true">↗</span>
              </button>
              <button type="button" id="reset-btn" class="btn btn-light">
                <span class="btn-label">지우기</span>
              </button>
            </div>
          </div>
        </form>

        <div id="error-box" class="error-box" role="alert" hidden></div>

        <section id="result-card" class="result-card" aria-live="polite" hidden>
          <div class="result-top">
            <span id="result-badge" class="badge">중립</span>
            <span id="result-confidence" class="confidence-number">0%</span>
          </div>
          <div class="confidence-bar" aria-hidden="true"><div id="confidence-fill" class="confidence-fill"></div></div>
          <p id="low-confidence-note" class="low-note" hidden>확신이 낮은 결과예요.</p>
          <h2 class="result-label">분석 이유</h2>
          <p id="result-reason" class="result-reason"></p>
        </section>
      </section>

      <aside class="hero-visual" aria-hidden="true">
        <div class="glass glass-back"></div>
        <div class="glass glass-front"><span>감성</span></div>
      </aside>

      <aside class="sample-card">
        <span class="tooltip">예시를 눌러보세요!</span>
        <p class="sample-title">이런 문장으로 체험해 보세요</p>
        <ul class="sample-list">
          <li><button type="button" class="sample-btn" data-text="이 가게 음식이 정말 맛있고 직원분들도 너무 친절했어요!">긍정 예시</button></li>
          <li><button type="button" class="sample-btn" data-text="배송이 일주일이나 늦었고 문의해도 답변이 없어서 너무 실망했어요.">부정 예시</button></li>
          <li><button type="button" class="sample-btn" data-text="오늘 회의는 오후 3시에 3층 회의실에서 진행됩니다.">중립 예시</button></li>
        </ul>
      </aside>
    </div>
    <p class="privacy-note">입력한 문장은 분석 기록 저장을 위해 보관될 수 있어요. 개인정보는 입력하지 마세요.</p>
  </main>
  <script src="/js/app.js" defer></script>
</body>
```

- `.sr-only`(화면에는 안 보이고 스크린리더만 읽는 클래스)를 CSS에 정의합니다.
- 이모지 대신 텍스트/CSS 도형을 사용합니다. (아이콘 라이브러리 금지)

---

## 4. 컴포넌트별 스타일 규칙

### 4-1. 히어로 (`.hero`)
```css
.hero {
  margin: 16px;
  min-height: 640px;
  border-radius: var(--radius-hero);
  background: linear-gradient(115deg, var(--blue-700) 0%, var(--blue-600) 35%,
              var(--blue-300) 75%, var(--blue-100) 100%);
  color: var(--white);
  position: relative;
  overflow: hidden;
  padding: 72px 64px 48px;
}
```
- 배경에 살짝 빛이 번지는 느낌: `.hero::before`에 `radial-gradient(circle at 80% 20%, rgba(255,255,255,0.45), transparent 55%)`를 겹칩니다.

### 4-2. 알약 버튼 (`.btn`)
| 속성 | 값 |
|---|---|
| 높이 | 44px (모바일도 44px 이상 유지) |
| 좌우 안쪽 여백 | 22px |
| 모양 | `border-radius: var(--radius-pill)` |
| `.btn-dark` | 배경 `--ink-900`, 글자 흰색 |
| `.btn-light` | 배경 `--white`, 글자 `--ink-900` |
| 아이콘 | 글자 오른쪽 8px 간격, `↗` 문자 사용 |
| hover | 위로 1px 이동 + 그림자 살짝 |
| `:focus-visible` | 3px 흰색 외곽선 + 2px 파란 간격 (키보드 사용자용, 지우지 말 것) |
| `:disabled` | 투명도 0.6, 커서 `not-allowed` |

### 4-3. 입력 카드 (`.analyzer`)
- 배경 흰색, 모서리 `--radius-card`, 안쪽 여백 20px, 그림자 `--shadow-card`
- textarea: 테두리 없음, 글자색 `--ink-900`, 배경 투명, 크기 조절 불가(`resize: none`), 최소 높이 112px
- 글자 수 표시(`.char-count`): `--ink-600`, 14px. 450자 초과 시 `--negative` 색으로 변경, 500자 도달 시 굵게

### 4-3-1. 결과 카드 (`.result-card`)
- 입력 카드와 같은 흰색 카드 스타일, 위쪽 간격 16px
- 감성 배지(`.badge`): 알약 모양, 높이 44px, 글자 36px(모바일 30px)/굵기 800
  - `data-sentiment="positive"` → 글자 `--positive`, 배경 `--positive-bg`
  - `data-sentiment="negative"` → 글자 `--negative`, 배경 `--negative-bg`
  - `data-sentiment="neutral"` → 글자 `--neutral`, 배경 `--neutral-bg`
  - 색에만 의존하지 않도록 **반드시 글자(긍정/부정/중립)도 함께 표시**
- 신뢰도 숫자(`.confidence-number`): 오른쪽 정렬, 28px, 굵기 800, `--ink-900`
- 신뢰도 막대: 높이 10px, 둥근 모서리, 배경 `--ink-300`의 연한 톤(`#E2E8F0`), 채움색은 감성 색상과 동일, 너비 transition 0.6s
- 분석 이유 제목(`.result-label`): 14px, `--ink-600`, 굵기 700 / 이유 본문: 16px, `--ink-900`, 줄 간격 1.6
- 등장 애니메이션: 아래에서 8px 올라오며 페이드인 0.3s

### 4-4. 유리 도형 (`.hero-visual`) — CSS로 직접 구현

참고 화면의 "유리처럼 반투명한 둥근 사각형 2개가 겹친" 모양입니다. 아래 코드를 기준으로 하세요.

```css
.hero-visual { position: absolute; right: 80px; top: 120px; width: 300px; height: 300px; pointer-events: none; }
.glass {
  position: absolute; width: 210px; height: 210px;
  border-radius: 56px; transform: rotate(14deg);
  backdrop-filter: blur(6px);
  box-shadow: inset 0 2px 12px rgba(255,255,255,0.7), 0 20px 40px rgba(29,85,232,0.25);
}
.glass-back  { left: 0; top: 30px; background: linear-gradient(145deg, rgba(255,255,255,0.85), rgba(255,255,255,0.25)); }
.glass-front { right: 0; top: 0; background: linear-gradient(145deg, #3F7DFF, #1D55E8); display: grid; place-items: center; }
.glass-front span { color: #fff; font-weight: 800; font-size: 34px; transform: rotate(-14deg); }
@media (prefers-reduced-motion: no-preference) {
  .glass-front { animation: float 6s ease-in-out infinite; }
  .glass-back  { animation: float 7s ease-in-out infinite reverse; }
}
@keyframes float { 0%,100% { translate: 0 0; } 50% { translate: 0 -10px; } }
```
- 이 도형은 **장식**이므로 `aria-hidden="true"`이고, 클릭할 수 없습니다.
- `prefers-reduced-motion`(움직임 줄이기 설정)을 켠 사용자에게는 움직이지 않습니다.

### 4-5. 예시 카드 (`.sample-card`)
- 위치(데스크톱): 히어로 오른쪽 아래, `right: 0; bottom: 0; width: 340px`
- 배경 흰색, 왼쪽 위 모서리만 크게 둥글게: `border-radius: 48px 0 var(--radius-hero) 0` (참고 화면의 곡선 컷 느낌)
- 안쪽 여백 24px, 제목 16px 굵게, 예시 버튼은 알약형 연한 파랑 배경(`--blue-100`)·글자 `--blue-700`
- 말풍선(`.tooltip`): 검정(`--ink-900`) 알약, 흰 글자 12px, 카드 위쪽에 겹쳐 배치

### 4-6. 오류 박스 (`.error-box`)
- 배경 `--error-bg`, 글자 `--error`, 테두리 1px `#F9C9C2`, 모서리 16px, 안쪽 여백 14px 18px
- 위치: 입력 카드 바로 아래 16px 간격
- 내용 앞에 `⚠` 문자를 붙이지 않고, 글자만 표시합니다. (아이콘 의존 금지)

### 4-7. 개인정보 안내 (`.privacy-note`)
- 히어로 하단, 12px, 흰색 70%, 가운데 정렬

---

## 5. 반응형 규칙

| 구간 | 폭 | 레이아웃 |
|---|---|---|
| 데스크톱 | 1024px 이상 | 3-1의 배치 그대로 |
| 태블릿 | 640 ~ 1023px | 세로 한 줄 배치. 유리 도형은 오른쪽 위로 작게(너비 200px, 투명도 0.9). 예시 카드는 결과 카드 아래, 폭 100%로 이동 |
| 모바일 | 640px 미만 | 히어로 바깥 여백 8px, 안쪽 여백 `40px 20px 28px`, 모서리 28px, 유리 도형 너비 140px(제목 오른쪽 위에 겹침, `opacity: 0.8`), 버튼은 한 줄에 두 개 나란히(`flex: 1`) |

- 가로 스크롤이 생기면 안 됩니다. (`overflow-x` 확인)
- 예시 카드가 아래로 내려올 때는 `position: static`으로 바꿔서 겹침이 없도록 합니다.

---

## 6. 접근성 규칙

- 모든 입력 요소에 `label` 연결 (보이지 않아도 `.sr-only`로 제공)
- 결과 카드는 `aria-live="polite"`, 오류 박스는 `role="alert"`
- 키보드: `Tab` 이동 순서 = 입력창 → 분석하기 → 지우기 → 예시 버튼, `:focus-visible` 표시 유지
- 글자와 배경 대비비 4.5:1 이상 (흰 글자는 `--blue-700 ~ --blue-600` 위에서만 사용, 연한 하늘색 위에 흰 글자 금지 → 연한 영역에는 `--ink-900` 사용)
- 감성은 **색 + 글자** 두 가지로 전달

---

## 7. 구현 범위 / 제약 조건

**범위:** `index.html`, `style.css`의 시각 구현 및 이 문서에 정의된 상태(기본/로딩/성공/오류)의 스타일
**제약:**
- 외부 CSS/JS 라이브러리, 이미지 파일, 아이콘 폰트 사용 금지 (Pretendard 폰트 CDN만 예외)
- 색상은 반드시 `:root` 변수로 사용 (hex 값을 선택자 안에 직접 쓰지 않음. 단, 4-4의 그림자/그라데이션 보조값은 허용)
- 다크 모드, 테마 전환 없음

---

## 8. 완료 기준 / 검증 기준

| # | 검증 항목 | 방법 | 기대 결과 |
|---|---|---|---|
| 1 | 분위기 일치 | 참고 화면과 나란히 비교 | 파란 그라데이션, 큰 둥근 카드, 알약 버튼, 유리 도형이 보임 |
| 2 | 브랜드 미사용 | 화면/코드에서 "교보", "SBI", "사이다" 검색 | **0건** |
| 3 | 데스크톱 배치 | 브라우저 폭 1280px | 3-1 배치와 동일, 겹침 없음 |
| 4 | 태블릿 배치 | 폭 768px | 예시 카드가 아래로 이동, 겹침 없음 |
| 5 | 모바일 배치 | 폭 375px | 가로 스크롤 없음, 버튼 2개가 나란히 표시 |
| 6 | 상태 확인(가짜 데이터) | 개발자 도구에서 `hidden` 제거 또는 JS mock | 긍정/부정/중립/오류 4가지 모양이 모두 올바름 |
| 7 | 키보드 사용 | `Tab` 키만으로 이동 | 포커스 표시가 보이고 모든 버튼에 도달 |
| 8 | 외부 의존성 | Network 탭 | 폰트 CDN 외 외부 요청 없음 |
| 9 | 색 변수 | `style.css` 확인 | `:root`에 2번의 변수가 모두 정의됨 |
