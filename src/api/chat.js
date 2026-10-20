import { request } from './http.js';

// Chat은 CORS 설정이 없어서 Vite 개발 서버가 /chat-api 로 받아 대신 부른다 (vite.config.js)
const CHAT_PROXY = '/chat-api';

/** 채팅방을 가리키는 값: 프록시 경로 + 참여자 확인용 memberId */
export function roomRef(roomId, memberId) {
  return { id: Number(roomId), path: `${CHAT_PROXY}/chat/rooms/${roomId}`, memberId: Number(memberId) };
}

/** Trade가 준 _links.chat (예: http://localhost:8080/chat/rooms/5?memberId=3) → roomRef */
export function roomFromLink(link) {
  const url = new URL(link.href);
  const id = url.pathname.split('/').pop();
  return { id: Number(id), path: `${CHAT_PROXY}${url.pathname}`, memberId: Number(url.searchParams.get('memberId')) };
}

/** POST /chat/rooms — 같은 상품·구매자·판매자의 방이 있으면 Chat이 기존 방을 돌려준다 (200) */
export async function openRoom({ productId, buyerId, sellerId }) {
  const { data } = await request(`${CHAT_PROXY}/chat/rooms`, {
    method: 'POST',
    body: { productId, buyerId, sellerId },
  });
  return data; // { id, productId, buyerId, sellerId }
}

/** GET /chat/rooms?memberId= — 내 방 목록 (마지막 메시지, 안 읽은 수) */
export async function listRooms(memberId) {
  const { data } = await request(`${CHAT_PROXY}/chat/rooms?memberId=${memberId}`);
  return data ?? [];
}

/** GET /chat/rooms/{id}?memberId= — 방 상세 */
export async function getRoom(room) {
  const { data } = await request(`${room.path}?memberId=${room.memberId}`);
  return data;
}

/** GET /chat/rooms/{id}/messages?memberId=&afterId= — afterId 다음 메시지들 (최대 100) */
export async function listMessages(room, afterId) {
  const params = new URLSearchParams({ memberId: String(room.memberId), limit: '100' });
  if (afterId) params.set('afterId', String(afterId));
  const { data } = await request(`${room.path}/messages?${params}`);
  return data ?? [];
}

/** POST /chat/rooms/{id}/messages — Idempotency-Key 필수. 같은 키·내용의 재전송은 같은 메시지를 돌려준다 */
export async function sendMessage(room, content, idempotencyKey) {
  const { data } = await request(`${room.path}/messages`, {
    method: 'POST',
    idempotencyKey,
    body: { senderId: room.memberId, content },
  });
  return data;
}

/** PATCH /chat/rooms/{id}/read-position — 여기까지 읽었음 */
export async function markRead(room, lastReadMessageId) {
  await request(`${room.path}/read-position`, {
    method: 'PATCH',
    body: { memberId: room.memberId, lastReadMessageId },
  });
}

/** 거래 알림 메시지. 키를 거래 번호 + 행동으로 만들어, 다시 보내도 한 번만 쌓인다 */
export async function sendTradeNotice(room, tradeId, action, text) {
  return sendMessage(room, `[WON-pick] ${text}`, `trade-${tradeId}-${action}`);
}
