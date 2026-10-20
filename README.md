# WON-pick Web

우리WON 청년 IT 아카데미(A·B반) 교내 중고거래 서비스 **WON-pick**의 React 화면입니다.
핵심 기능 — **상품 둘러보기 → 구매 문의 → 송금 요청(판매자) → 입금 확인(판매자) → 구매 확정(구매자)** — 를 실제 API로 처음부터 끝까지 동작시킵니다.

## 연동 현황 (2026-10-20, 각 저장소 확인 기준)

| 서버 | 화면에서 쓰는 API | 상태 |
| --- | --- | --- |
| Market (`market-service`, 8082) | `POST /users`, `GET /users/{id}`, `GET /categories`, `GET /products`, `GET /products/{id}`, `POST /products` | 연동함 |
| Trade (`trade-service`, 8083) | `GET/POST /trades`, `GET /trades/{id}`, `_links` 상태 변경 | 연동함 |
| Payment (`payment-service`) | 화면에서 직접 부르지 않음 (Trade가 부름) | 서버 API 아직 없음 → Trade `stub-pay` 프로필로 대신 |
| Chat (`chat-service`) | 채팅 화면 | 서버 아직 없음 → 생략, 거래 화면에 채팅방 링크만 표시 |

생략한 것: 채팅, 찜, 상품 수정·삭제, 이미지 업로드(사진은 이미지 주소로 등록).

## 화면

1. **시작** — 닉네임으로 가입하거나 회원 번호로 계속합니다. 로그인이 없는 실습이라 회원 번호를 브라우저에 기억하고, Market에는 `X-User-Id`, Trade에는 `X-Member-Id` 헤더로 보냅니다.
2. **상품 둘러보기** — 최신순 목록, 상품명 검색, 카테고리. 상세에서 **구매 문의하기**는 Market이 `_links.trade`를 줄 때만 보이고, 그 링크(Trade `POST /trades`)를 그대로 따라갑니다.
3. **상품 올리기** — Market `POST /products`.
4. **내 거래** — 구매/판매 탭. 판매 탭은 상품별로 묶어서 문의한 구매자를 보여 줍니다(한 상품에 여러 명 문의 가능).
5. **거래 장부** — 단계마다 도장이 찍히고, 버튼은 Trade 응답의 `_links`에 있는 것만 그립니다. 끝나지 않은 거래는 5초마다 다시 읽어 상대방의 행동을 반영합니다.

| `_links` | 버튼 |
| --- | --- |
| `trade` (Market 상품) | 구매 문의하기 |
| `request-payment` | 송금 요청 보내기 (판매자) |
| `transfer` | 카카오페이로 송금하기 (구매자, 새 창) |
| `confirm-payment` | 입금 확인 (판매자) |
| `complete` | 구매 확정 (구매자) |
| `cancel` | 거래 취소 (사유 입력) |

화면에는 상태 전이 규칙이 없습니다. `tradeText.js`는 상태 이름을 한국어로 바꾸는 문구표일 뿐입니다.

## 실행

Node.js 20 이상이 필요합니다.

```bash
npm install
npm run dev        # http://localhost:5173
```

서버 주소를 바꾸려면 `.env.example`을 `.env`로 복사해 고칩니다 (`VITE_MARKET_URL`, `VITE_TRADE_URL`).
두 서버 모두 5173 CORS를 열어 두어서 브라우저가 직접 부릅니다.

### 지금 상태로 전체 흐름 확인하기

1. Market: `market-service`에서 `.\gradlew.bat bootRun --args="--spring.profiles.active=demo"` (8082, H2)
2. Trade: `trade-service`에서 `.\gradlew.bat bootRun --args="--spring.profiles.active=stub-pay"` (8083, Payment·Chat만 가짜)
3. 이 화면: `npm run dev`
4. 브라우저 창 A에서 판매자로 가입 → 상품 올리기
5. 시크릿 창 B에서 구매자로 가입 → 상품 둘러보기 → 구매 문의하기
6. 창 A: 내 거래 → 내가 파는 거래 → 송금 요청 보내기 → 창 B: 카카오페이로 송금하기 → 창 A: 입금 확인 → 창 B: 구매 확정

## 구조

```
src/
├── api/
│   ├── http.js        # fetch 공통: 헤더, 오류 모양(ProblemDetail / Market {code,message}) 해석
│   ├── market.js      # 회원·카테고리·상품
│   └── trade.js       # 거래 목록·조회·문의(Idempotency-Key)·링크 따라가기
├── components/
│   ├── MemberGate     # 시작
│   ├── ProductBrowser # 상품 목록·검색·카테고리
│   ├── ProductDetail  # 상품 상세 + 구매 문의
│   ├── ProductForm    # 상품 올리기
│   ├── TradeList      # 구매/판매 목록
│   ├── TradeDetail    # 거래 장부 + _links 버튼
│   ├── StepRail       # 단계 도장
│   └── ErrorNote      # 오류 문장 + 다음에 할 일
├── tradeText.js       # 상태·버튼 문구
└── session.js         # 현재 회원 기억
```
