// 서버 값 → 화면 문구. 상태 전이 규칙은 여기 없다 (그건 서버의 _links 가 알려 준다).

export const STATUS_LABEL = {
  REQUESTED: '결제 요청 준비',
  PAYMENT_REQUESTED: '결제 대기',
  PAID: '결제 완료',
  COMPLETED: '거래 완료',
  CANCELED: '취소됨',
};

export const STATUS_TONE = {
  REQUESTED: 'wait',
  PAYMENT_REQUESTED: 'wait',
  PAID: 'wait',
  COMPLETED: 'done',
  CANCELED: 'void',
};

// 거래 장부에 찍히는 도장 순서. 거래는 판매자의 결제 요청으로 시작한다.
export const STEPS = [
  { status: 'PAYMENT_REQUESTED', label: '결제 요청' },
  { status: 'PAID', label: '결제' },
  { status: 'COMPLETED', label: '구매 확정' },
];

// 링크 이름 → 버튼 문구와 설명. 서버가 링크를 줄 때만 버튼이 생긴다.
export const ACTIONS = {
  'request-payment': {
    label: '결제 요청 다시 보내기',
    hint: '중단된 상품 예약과 결제 요청을 다시 시도합니다.',
    primary: true,
  },
  pay: {
    label: '결제하기',
    hint: '실제 돈이 아닌 WON-pick 가상 잔액으로 결제합니다.',
    primary: true,
  },
  complete: {
    label: '구매 확정',
    hint: '물건을 받았다면 눌러 주세요. 확정하면 상품이 판매 완료로 바뀝니다.',
    primary: true,
  },
  cancel: {
    label: '거래 취소',
    hint: '구매 확정 전까지 취소할 수 있습니다. 결제했다면 가상 잔액이 환불되고 상품은 다시 판매 중이 됩니다.',
    danger: true,
  },
};

export const ACTION_ORDER = ['request-payment', 'pay', 'complete', 'cancel'];

// 행동이 끝난 뒤 채팅방에 남기는 알림 (Trade는 채팅방 검증만 하므로 화면이 알림을 보낸다)
export const CHAT_NOTICE = {
  pay: '결제를 마쳤어요. 물건을 받으면 구매 확정을 누를게요.',
  complete: '구매를 확정했어요. 거래가 끝났어요!',
  cancel: '거래를 취소했어요.',
};

export function won(price) {
  return `${Number(price ?? 0).toLocaleString('ko-KR')}원`;
}

export function dateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Market 상품 상태. RESERVED는 판매자가 한 구매자에게 결제 요청을 보낸 뒤의 상태라 "거래 중"으로 보여 준다.
export const PRODUCT_STATUS = {
  ON_SALE: '판매 중',
  RESERVED: '거래 중',
  SOLD: '판매 완료',
};

export const PRODUCT_TONE = {
  ON_SALE: 'open',
  RESERVED: 'wait',
  SOLD: 'done',
};
