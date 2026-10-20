import { request } from './http.js';

export const TRADE_URL = (import.meta.env.VITE_TRADE_URL || 'http://localhost:8083').replace(/\/$/, '');

export function newIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** GET /trades?role=&productId= — 내 거래 목록 */
export async function listTrades(memberId, { role, productId } = {}) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (productId) params.set('productId', productId);
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
 * 구매 문의 — Market 상품의 _links.trade 를 따라 POST 한다 (없으면 기본 주소).
 * 버튼을 한 번 누를 때 키를 하나 만들고, 같은 누름의 재시도에는 같은 키를 쓴다.
 */
export async function createTrade(memberId, productId, idempotencyKey, href = `${TRADE_URL}/trades`) {
  const { status, data } = await request(href, {
    method: 'POST',
    memberId,
    idempotencyKey,
    body: { productId: Number(productId) },
  });
  return { created: status === 201, trade: data };
}

/** HATEOAS — 서버가 준 상태 변경 링크를 그대로 따라간다. 모두 POST. */
export async function followLink(memberId, link, body) {
  const { data } = await request(link.href, { method: 'POST', memberId, body });
  return data;
}
