// 서버 값 → 화면 문구. 상태 전이 규칙은 여기 없다 (그건 서버의 _links 가 알려 준다).

export const STATUS_LABEL = {
  PAYMENT_REQUESTED: '송금 대기',
  PAID: '입금 확인됨',
  COMPLETED: '거래 완료',
  CANCELED: '취소됨',
};

export const STATUS_TONE = {
  PAYMENT_REQUESTED: 'wait',
  PAID: 'wait',
  COMPLETED: 'done',
  CANCELED: 'void',
};

// 거래 장부에 찍히는 도장 순서. 거래는 판매자의 송금 요청으로 시작한다.
export const STEPS = [
  { status: 'PAYMENT_REQUESTED', label: '송금 요청' },
  { status: 'PAID', label: '입금 확인' },
  { status: 'COMPLETED', label: '구매 확정' },
];

// 링크 이름 → 버튼 문구와 설명. 서버가 링크를 줄 때만 버튼이 생긴다.
export const ACTIONS = {
  transfer: {
    label: '카카오페이로 송금하기',
    hint: '판매자의 송금 링크가 새 창으로 열립니다. 보낸 뒤에는 판매자가 입금을 확인할 때까지 기다려 주세요.',
    primary: true,
    external: true,
  },
  'confirm-payment': {
    label: '입금 확인',
    hint: '카카오페이에서 돈이 들어온 것을 확인했다면 눌러 주세요.',
    primary: true,
  },
  complete: {
    label: '구매 확정',
    hint: '물건을 받았다면 눌러 주세요. 확정하면 상품이 판매 완료로 바뀝니다.',
    primary: true,
  },
  cancel: {
    label: '거래 취소',
    hint: '입금이 확인되기 전까지만 취소할 수 있습니다. 취소하면 상품이 다시 판매 중이 됩니다.',
    danger: true,
  },
};

export const ACTION_ORDER = ['transfer', 'confirm-payment', 'complete', 'cancel'];

// 행동이 끝난 뒤 채팅방에 남기는 알림 (Trade는 Chat을 부르지 않으므로 화면이 보낸다)
export const CHAT_NOTICE = {
  'confirm-payment': '입금을 확인했어요. 물건을 받으면 구매 확정을 눌러 주세요.',
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

// Market 상품 상태. RESERVED는 판매자가 한 구매자에게 송금 요청을 보낸 뒤의 상태라 "거래 중"으로 보여 준다.
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
