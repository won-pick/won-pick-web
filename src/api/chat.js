import { request } from './http.js';

const CHAT_PROXY = '/chat-api';

/**
 * Trade가 준 _links.chat (예: http://localhost:8080/chat/rooms/5?memberId=3) 을
 * Vite 프록시 주소(/chat-api/chat/rooms/5)로 바꾼다. 경로는 서버가 준 것을 그대로 쓴다.
 */
export function roomFromLink(link) {
  const url = new URL(link.href);
  return { path: `${CHAT_PROXY}${url.pathname}`, memberId: Number(url.searchParams.get('memberId')) };
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
