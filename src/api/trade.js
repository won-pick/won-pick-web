import { request } from './http.js';

export const TRADE_URL = (import.meta.env.VITE_TRADE_URL || 'http://localhost:8083').replace(/\/$/, '');

export function newIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** GET /trades?role=&productId=&chatRoomId= — 내 거래 목록 (최신순) */
export async function listTrades(memberId, { role, productId, chatRoomId } = {}) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (productId) params.set('productId', productId);
  if (chatRoomId) params.set('chatRoomId', chatRoomId);
  const query = params.toString();
  const { data } = await request(`${TRADE_URL}/trades${query ? `?${query}` : ''}`, { memberId });
  return data?.trades ?? [];
}

/** GET /trades/{id} */
export async function getTrade(memberId, tradeId) {
  const { data } = await request(`${TRADE_URL}/trades/${tradeId}`, { memberId });
  return data;
}

/**
 * POST /trades — 판매자가 채팅방에서 보내는 송금 요청. 이때 거래가 생긴다.
 * 버튼을 한 번 누를 때 키를 하나 만들고, 같은 누름의 재시도에는 같은 키를 쓴다 (거래가 두 건 생기지 않음).
 */
export async function requestPayment(sellerId, { productId, buyerId, chatRoomId }, idempotencyKey) {
  const { status, data } = await request(`${TRADE_URL}/trades`, {
    method: 'POST',
    memberId: sellerId,
    idempotencyKey,
    body: { productId, buyerId, chatRoomId },
  });
  return { created: status === 201, trade: data };
}

/** HATEOAS — 서버가 준 상태 변경 링크를 그대로 따라간다. 모두 POST. */
export async function followLink(memberId, link, body) {
  const { data } = await request(link.href, { method: 'POST', memberId, body });
  return data;
}
