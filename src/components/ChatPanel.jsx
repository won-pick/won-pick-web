import { useEffect, useRef, useState } from 'react';
import { listMessages, markRead, sendMessage } from '../api/chat.js';
import { newIdempotencyKey } from '../api/trade.js';
import { dateTime } from '../tradeText.js';
import ErrorNote from './ErrorNote.jsx';

const POLL_MS = 3000;

/**
 * 채팅방 대화. room = { id, path, memberId } (api/chat.js 의 roomRef / roomFromLink).
 * 새 메시지는 3초마다 afterId 로 이어서 받는다. reloadKey가 바뀌면 바로 한 번 더 받는다.
 */
export default function ChatPanel({ room, otherLabel, reloadKey = 0 }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const pendingKey = useRef(null);
  const listRef = useRef(null);
  const lastIdRef = useRef(0);
  const pullRef = useRef(() => {});

  const roomKey = room ? `${room.path}|${room.memberId}` : '';

  useEffect(() => {
    setMessages([]);
    lastIdRef.current = 0;
    setError(null);
    if (!room) return undefined;
    let alive = true;

    async function pull() {
      try {
        const next = await listMessages(room, lastIdRef.current);
        if (!alive || next.length === 0) return;
        lastIdRef.current = next[next.length - 1].id;
        setMessages((prev) => [...prev, ...next.filter((m) => !prev.some((p) => p.id === m.id))]);
        markRead(room, lastIdRef.current).catch(() => {});
        setError(null);
      } catch (e) {
        if (alive) setError(e);
      }
    }

    pullRef.current = pull;
    pull();
    const timer = setInterval(pull, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
    // room 객체가 새로 만들어져도 같은 방이면 다시 시작하지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomKey]);

  useEffect(() => {
    if (reloadKey) pullRef.current();
  }, [reloadKey]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  if (!room) return null;

  async function handleSend(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    if (!pendingKey.current) pendingKey.current = newIdempotencyKey();
    setSending(true);
    setError(null);
    try {
      const sent = await sendMessage(room, content, pendingKey.current);
      pendingKey.current = null;
      setDraft('');
      lastIdRef.current = Math.max(lastIdRef.current, sent.id);
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
    } catch (e) {
      if (e.status !== 0) pendingKey.current = null; // 연결 실패만 같은 키로 다시 보낸다
      setError(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat" aria-labelledby="chat-title">
      <header className="chat-head">
        <h3 id="chat-title">{otherLabel}와 대화</h3>
        <p>거래 장소와 시간을 여기서 정해요.</p>
      </header>

      <ol className="chat-log" ref={listRef} aria-live="polite">
        {messages.length === 0 && <li className="chat-empty">아직 대화가 없어요. 먼저 인사해 보세요.</li>}
        {messages.map((m) => {
          const mine = m.senderId === room.memberId;
          const notice = m.content.startsWith('[WON-pick]');
          return (
            <li key={m.id} className={`bubble-row${mine ? ' is-mine' : ''}${notice ? ' is-notice' : ''}`}>
              <p className="bubble">{notice ? m.content.replace('[WON-pick] ', '') : m.content}</p>
              <span className="bubble-meta">
                {mine ? '나' : otherLabel} · {dateTime(m.sentAt)}
              </span>
            </li>
          );
        })}
      </ol>

      <form className="chat-form" onSubmit={handleSend}>
        <label htmlFor="chat-input" className="sr-only">
          메시지
        </label>
        <input
          id="chat-input"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            pendingKey.current = null; // 내용이 바뀌면 새 메시지 — 새 키
          }}
          maxLength={1000}
          placeholder="메시지를 입력하세요"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
          {sending ? '보내는 중…' : '보내기'}
        </button>
      </form>

      <ErrorNote error={error} />
    </section>
  );
}
