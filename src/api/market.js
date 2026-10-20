import { request } from './http.js';

export const MARKET_URL = (import.meta.env.VITE_MARKET_URL || 'http://localhost:8082').replace(/\/$/, '');

/** POST /users — 닉네임 회원가입. 201 { userId, nickname, status, createdAt } */
export async function signUp(nickname) {
  const { data } = await request(`${MARKET_URL}/users`, { method: 'POST', body: { nickname } });
  return data;
}

/** GET /users/{userId} — "회원 번호로 계속"할 때 닉네임 확인 */
export async function getUser(userId) {
  const { data } = await request(`${MARKET_URL}/users/${userId}`);
  return data;
}

/** GET /categories — [{ code, name }] */
export async function listCategories() {
  const { data } = await request(`${MARKET_URL}/categories`);
  return data ?? [];
}

/**
 * GET /products — 최신순 목록·검색. X-User-Id를 보내면 찜·소유자 링크가 내 기준으로 온다.
 * 응답 { items, page, size, totalElements, totalPages, _links }
 */
export async function listProducts(userId, { keyword, category, status, page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (keyword) params.set('keyword', keyword);
  if (category) params.set('category', category);
  if (status) params.set('status', status);
  const { data } = await request(`${MARKET_URL}/products?${params}`, { userId });
  return data;
}

/** GET /users/{userId}/products — 내가 올린 상품 */
export async function listMyProducts(userId) {
  const { data } = await request(`${MARKET_URL}/users/${userId}/products?size=100`, { userId });
  return data?.items ?? [];
}

/** GET /products/{id} — 상세와 지금 가능한 행동 링크(trade, edit, delete, favorite …) */
export async function getProduct(userId, productId) {
  const { data } = await request(`${MARKET_URL}/products/${productId}`, { userId });
  return data;
}

/** POST /products — 상품 등록. Market은 모르는 필드를 거절하므로 정해진 필드만 보낸다 */
export async function createProduct(sellerId, { title, description, price, category, imageUrl }) {
  const { data } = await request(`${MARKET_URL}/products`, {
    method: 'POST',
    body: {
      sellerId,
      title,
      description: description || null,
      price: Number(price),
      category,
      imageUrl: imageUrl || null,
    },
  });
  return data;
}
