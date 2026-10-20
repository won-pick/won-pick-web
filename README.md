# WON-pick Web

우리WON 청년 IT 아카데미(A·B반) 교내 중고거래 서비스 **WON-pick**의 React 화면입니다.
핵심 기능 — **상품 둘러보기 → 판매자와 채팅 → 채팅방에서 결제 요청(판매자) → 잔액 결제(구매자) → 구매 확정(구매자)** — 를 실제 API로 처음부터 끝까지 동작시킵니다.

## 연동 현황 (2026-10-20, 각 저장소 확인 기준)

| 서버 | 화면에서 쓰는 API | 상태 |
| --- | --- | --- |
| Market (`market-service`, 8082) | `POST /users`, `GET /users/{id}`, `GET /categories`, `GET /products`, `GET /products/{id}`, `POST /products` | 연동함 |
| Trade (`trade-service`, 8083) | `POST /trades`(결제 요청), `GET /trades?chatRoomId=`, `GET /trades/{id}`, `_links` 상태 변경 | 연동함 |
| Chat (`chat-service`, 8080) | `POST /chat/rooms`, `GET /chat/rooms?memberId=`, `GET/POST /chat/rooms/{id}/messages`, `PATCH .../read-position` | 연동함 |
| Payment (`payment-service`, 8084) | 화면에서 직접 부르지 않음 (Trade가 `POST /orders`, `POST /orders/{id}/payments` 호출) | 연동함 |

생략한 것: 찜, 상품 수정·삭제, 이미지 업로드(사진은 이미지 주소로 등록), 잔액 조회(Payment API 없음).

**거래가 생기는 시점:** 판매자가 채팅방에서 "결제 요청 보내기"를 누를 때입니다. 이 버튼은 화면이 Trade `POST /trades`를 직접 부르고(팀 결정), Trade는 Chat을 부르지 않습니다. 결제 요청·결제·구매 확정·취소 알림은 화면이 채팅방에 메시지로 남깁니다(거래 번호 기반 `Idempotency-Key`라 다시 보내도 한 번만 쌓임).

## 화면

1. **시작** — 닉네임으로 가입하거나 회원 번호로 계속합니다. 로그인이 없는 실습이라 회원 번호를 브라우저에 기억하고, Market에는 `X-User-Id`, Trade에는 `X-Member-Id`, Chat에는 `memberId`/`senderId`로 보냅니다.
2. **상품 둘러보기** — 최신순 목록, 상품명 검색, 카테고리. 상세의 **판매자와 채팅하기**는 Market이 `_links.trade`(거래 가능 신호)를 줄 때만 보이고, Chat에 방을 엽니다(이미 있으면 기존 방). 내 상품이면 **이 상품의 채팅 보기**.
3. **채팅** — 내 채팅방 목록(마지막 메시지·안 읽은 수). 방을 열면 위에서부터 채팅방 정보 → 거래 카드 → 대화.
   - 판매자이고, 진행 중인 거래가 없고, 상품이 판매 중이면 **결제 요청 보내기** 버튼이 보입니다.
   - 거래가 생기면 거래 카드의 버튼은 Trade 응답의 `_links`에 있는 것만 그립니다.
4. **내 거래** — 구매/판매 탭과 거래 장부, 그 거래의 대화.
5. **상품 올리기** — Market `POST /products`.

| `_links` | 버튼 |
| --- | --- |
| `trade` (Market 상품) | 판매자와 채팅하기 |
| `pay` | 결제하기 (구매자, 잔액에서 판매자에게 바로 이동) |
| `complete` | 구매 확정 (구매자) |
| `cancel` | 거래 취소 (사유 입력) |

화면에는 상태 전이 규칙이 없습니다. `tradeText.js`는 상태 이름을 한국어로 바꾸는 문구표일 뿐입니다.

## 실행

Node.js 20 이상이 필요합니다.

```bash
npm install
npm run dev        # http://localhost:5173
```

서버 주소를 바꾸려면 `.env.example`을 `.env`로 복사해 고칩니다.

| 변수 | 기본값 | 호출 방식 |
| --- | --- | --- |
| `VITE_MARKET_URL` | `http://localhost:8082` | 브라우저가 직접 (Market이 5173 CORS 허용) |
| `VITE_TRADE_URL` | `http://localhost:8083` | 브라우저가 직접 (Trade가 5173 CORS 허용) |
| `CHAT_SERVER_URL` | `http://localhost:8080` | Vite 개발 서버가 `/chat-api`로 대신 (Chat에 CORS 설정이 아직 없음) |

### 전체 흐름 확인하기

서버 4개와 이 화면을 한 PC에서 한꺼번에 띄우려면 `trade-service\scripts\run-all.cmd`를 실행합니다 (자세한 내용은 trade-service README).

1. 브라우저 창 A에서 판매자로 가입 → 상품 올리기
2. 시크릿 창 B에서 구매자로 가입 → 상품 둘러보기 → 판매자와 채팅하기 → 인사
3. 창 A: 채팅 → 방 열기 → 결제 요청 보내기 → 창 B: 결제하기 → 창 B: 구매 확정

서버들이 서로 다른 PC에서 돌면 `.env`에 각 PC의 IP를 넣고(`http://172.21.26.x:포트`), 시연은 이 화면을 실행한 PC의 브라우저에서 `http://localhost:5173`으로 하세요. 그러면 Market·Trade의 CORS 설정을 바꿀 필요가 없습니다.

## 구조

```
src/
├── api/
│   ├── http.js        # fetch 공통: 헤더, 오류 모양(ProblemDetail / Market {code,message}) 해석
│   ├── market.js      # 회원·카테고리·상품
│   ├── trade.js       # 결제 요청(Idempotency-Key)·목록·조회·링크 따라가기
│   └── chat.js        # 방 열기·목록, 메시지·읽음, 거래 알림
├── components/
│   ├── MemberGate     # 시작
│   ├── ProductBrowser # 상품 목록·검색·카테고리
│   ├── ProductDetail  # 상품 상세 + 판매자와 채팅하기
│   ├── ProductForm    # 상품 올리기
│   ├── ChatView       # 채팅 목록 + 채팅방(거래 카드, 결제 요청, 대화)
│   ├── TradeList      # 구매/판매 목록
│   ├── TradeDetail    # 거래 장부 + _links 버튼
│   ├── StepRail       # 단계 도장
│   ├── ChatPanel      # 거래 대화
│   └── ErrorNote      # 오류 문장 + 다음에 할 일
├── tradeText.js       # 상태·버튼 문구
└── session.js         # 현재 회원 기억
```
