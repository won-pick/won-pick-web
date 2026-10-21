import { useCallback, useEffect, useRef, useState } from 'react';
import { listRooms, roomRef, sendTradeNotice } from '../api/chat.js';
import { getProduct } from '../api/market.js';
import { listTrades, newIdempotencyKey, requestPayment } from '../api/trade.js';
import { CHAT_NOTICE, PRODUCT_STATUS, PRODUCT_TONE, STATUS_LABEL, STATUS_TONE, won } from '../tradeText.js';
import ChatPanel from './ChatPanel.jsx';
import ErrorNote from './ErrorNote.jsx';
import TradeDetail from './TradeDetail.jsx';

const POLL_MS = 5000;

/**
 * 채팅 — 한 상품에 여러 구매자가 각자 방을 가진다.
 * 판매자는 방 안에서 "결제 요청 보내기"로 거래를 시작한다 (화면이 Trade POST /trades 를 직접 부른다).
 */
export default function ChatView({ memberId, roomId, productFilter, onSelectRoom, onClearFilter, onTradeChanged }) {
  const [rooms, setRooms] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshRooms = useCallback(async () => {
    setLoading(true);
    try {
      setRooms(await listRooms(memberId));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    refreshRooms();
    const timer = setInterval(refreshRooms, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshRooms]);

  // 방 목록에 상품 제목을 붙이려고 Market에서 상품을 한 번씩 읽어 둔다
  useEffect(() => {
    const missing = [...new Set(rooms.map((r) => r.productId))].filter((id) => !(id in products));
    if (missing.length === 0) return;
    Promise.all(missing.map((id) => getProduct(memberId, id).then((p) => [id, p]).catch(() => [id, null]))).then(
      (pairs) => setProducts((prev) => ({ ...prev, ...Object.fromEntries(pairs) })),
    );
  }, [rooms, products, memberId]);

  const visible = productFilter ? rooms.filter((r) => r.productId === productFilter) : rooms;
  const selected = rooms.find((r) => r.id === roomId) ?? null;

  return (
    <div className="workspace">
      <aside className="sidebar">
        {productFilter && (
          <p className="filter-note">
            {products[productFilter]?.title ?? `상품 ${productFilter}번`}의 채팅만 보는 중
            <button type="button" className="btn-link" onClick={onClearFilter}>
              모두 보기
            </button>
          </p>
        )}
        <ErrorNote error={error} />
        {loading && rooms.length === 0 && <p className="list-empty">채팅을 불러오는 중이에요.</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="list-empty">
            {productFilter
              ? '아직 이 상품에 채팅한 사람이 없어요.'
              : '아직 채팅이 없어요. 상품 둘러보기에서 마음에 드는 상품의 판매자와 채팅해 보세요.'}
          </p>
        )}
        <ul className="room-list">
          {visible.map((r) => {
            const product = products[r.productId];
            const buying = r.buyerId === memberId;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  className={`room-row${r.id === roomId ? ' is-selected' : ''}`}
                  aria-current={r.id === roomId ? 'true' : undefined}
                  onClick={() => onSelectRoom(r.id)}
                >
                  <span className="room-row-top">
                    <span className="room-row-title">{product?.title ?? `상품 ${r.productId}번`}</span>
                    {r.unreadCount > 0 && (
                      <span className="unread" aria-label={`안 읽은 메시지 ${r.unreadCount}개`}>
                        {r.unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="room-row-sub">
                    {buying ? `판매자 ${product?.sellerNickname ?? `${r.sellerId}번`}` : `구매자 ${r.buyerId}번`}
                  </span>
                  <span className="room-row-last">{r.lastMessage?.content?.replace('[WON-pick] ', '') ?? '대화를 시작해 보세요.'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="detail-column">
        {selected ? (
          <ChatRoom
            key={selected.id}
            memberId={memberId}
            room={selected}
            product={products[selected.productId]}
            onTradeChanged={() => {
              setProducts((prev) => {
                const next = { ...prev };
                delete next[selected.productId]; // 상품 상태(거래 중·판매 완료)를 다시 읽는다
                return next;
              });
              onTradeChanged();
            }}
          />
        ) : (
          <section className="detail detail-empty">
            <p>왼쪽에서 채팅방을 고르면 대화와 거래가 여기에 열려요.</p>
          </section>
        )}
      </div>
    </div>
  );
}

function ChatRoom({ memberId, room, product, onTradeChanged }) {
  const [trade, setTrade] = useState(null);
  const [tradeLoaded, setTradeLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [chatReload, setChatReload] = useState(0);
  const keyRef = useRef(null);

  const isSeller = room.sellerId === memberId;
  const ref = roomRef(room.id, memberId);
  const otherLabel = isSeller ? '구매자' : '판매자';

  const refreshTrade = useCallback(async () => {
    setRefreshing(true);
    try {
      const found = await listTrades(memberId, { chatRoomId: room.id });
      setTrade(found[0] ?? null); // 이 방에서 가장 최근 거래
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setRefreshing(false);
      setTradeLoaded(true);
    }
  }, [memberId, room.id]);

  useEffect(() => {
    refreshTrade();
    const timer = setInterval(refreshTrade, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshTrade]);

  async function notify(tradeId, action, text) {
    try {
      await sendTradeNotice(ref, tradeId, action, text);
      setChatReload((n) => n + 1);
    } catch {
      // 알림은 부가 기능 — 실패해도 거래는 이미 끝났다
    }
  }

  async function handleRequestPayment() {
    if (!keyRef.current) keyRef.current = newIdempotencyKey();
    setBusy(true);
    setError(null);
    try {
      const { trade: created } = await requestPayment(
        memberId,
        { productId: room.productId, buyerId: room.buyerId, chatRoomId: room.id },
        keyRef.current,
      );
      keyRef.current = null;
      setTrade(created);
      onTradeChanged();
      await notify(
        created.tradeId,
        'payment-request',
        `결제 요청을 보냈어요. 위의 '결제하기'로 ${won(created.price)}을 결제해 주세요.`,
      );
    } catch (e) {
      if (e.status >= 400 && e.status < 500) keyRef.current = null; // 연결 실패·서버 오류는 같은 키로 재시도
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  function handleChanged(updated, rel) {
    setTrade(updated);
    onTradeChanged();
    if (CHAT_NOTICE[rel]) notify(updated.tradeId, rel, CHAT_NOTICE[rel]);
  }

  const open = trade && !['COMPLETED', 'CANCELED'].includes(trade.status);
  const canRequest = isSeller && !open && product?.status === 'ON_SALE';

  return (
    <>
      <section className="room-head">
        <div>
          <p className="detail-sub">{isSeller ? `구매자 ${room.buyerId}번과의 채팅` : `${product?.sellerNickname ?? '판매자'} 님과의 채팅`}</p>
          <h2>{product?.title ?? `상품 ${room.productId}번`}</h2>
        </div>
        <div className="room-head-side">
          {product && <p className="detail-price">{won(product.price)}</p>}
          {trade ? (
            <span className={`pill pill-${STATUS_TONE[trade.status]}`}>{STATUS_LABEL[trade.status]}</span>
          ) : (
            product && <span className={`pill pill-${PRODUCT_TONE[product.status]}`}>{PRODUCT_STATUS[product.status]}</span>
          )}
        </div>
      </section>

      {tradeLoaded && !open && (
        <section className="request-box">
          {canRequest && (
            <div className="action">
              <button type="button" className="btn btn-primary" onClick={handleRequestPayment} disabled={busy}>
                {busy ? '요청하는 중…' : '결제 요청 보내기'}
              </button>
              <p className="action-hint">
                대화로 거래를 정했다면 이 구매자에게 {product ? won(product.price) : ''} 결제를 요청해요. 요청하면 상품이 거래 중이 되어
                다른 사람은 결제 요청을 받을 수 없어요.
              </p>
            </div>
          )}
          {!canRequest && !isSeller && product?.status === 'ON_SALE' && (
            <p className="actions-wait">판매자와 거래를 정하면 판매자가 결제 요청을 보내요. 그때 여기에 결제 버튼이 생겨요.</p>
          )}
          {product && product.status === 'RESERVED' && (
            <p className="actions-wait">이 상품은 다른 채팅방에서 거래가 진행 중이에요.</p>
          )}
          {product && product.status === 'SOLD' && !trade && <p className="actions-wait">판매가 끝난 상품이에요.</p>}
          <ErrorNote error={error} />
        </section>
      )}

      {trade && (
        <TradeDetail compact memberId={memberId} trade={trade} onChanged={handleChanged} onRefresh={refreshTrade} refreshing={refreshing} />
      )}
      {trade && open && <ErrorNote error={error} />}

      <ChatPanel room={ref} otherLabel={otherLabel} reloadKey={chatReload} />
    </>
  );
}
