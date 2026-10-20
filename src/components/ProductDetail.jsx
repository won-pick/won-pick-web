import { useEffect, useState } from 'react';
import { openRoom } from '../api/chat.js';
import { getProduct } from '../api/market.js';
import { PRODUCT_STATUS, PRODUCT_TONE, won } from '../tradeText.js';
import ErrorNote from './ErrorNote.jsx';
import { Thumb } from './ProductBrowser.jsx';

/**
 * 상품 상세 — Market GET /products/{id}.
 * "판매자와 채팅하기"는 Market이 _links.trade(거래 가능 신호)를 줄 때만 보인다 — 판매 중이고 내 상품이 아닐 때.
 * 누르면 Chat 서버에 채팅방을 연다 (이미 있으면 Chat이 기존 방을 돌려준다).
 */
export default function ProductDetail({ userId, productId, categories, onChatOpened, onShowChats }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (!productId) return undefined;
    let alive = true;
    setLoading(true);
    setActionError(null);
    getProduct(userId, productId)
      .then((p) => {
        if (!alive) return;
        setProduct(p);
        setError(null);
      })
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId, productId]);

  if (!productId) {
    return (
      <section className="detail detail-empty">
        <p>왼쪽에서 상품을 고르면 여기에 자세히 보여요.</p>
      </section>
    );
  }
  if (error) {
    return (
      <section className="detail">
        <ErrorNote error={error} />
      </section>
    );
  }
  if (!product || product.productId !== productId) {
    return (
      <section className="detail detail-empty">
        <p>{loading ? '상품을 불러오는 중이에요.' : ''}</p>
      </section>
    );
  }

  const links = product._links ?? {};
  const mine = product.sellerId === userId;
  const categoryName = categories.find((c) => c.code === product.category)?.name ?? product.category;

  async function startChat() {
    setBusy(true);
    setActionError(null);
    try {
      const room = await openRoom({ productId: product.productId, buyerId: userId, sellerId: product.sellerId });
      onChatOpened(room.id);
    } catch (e) {
      setActionError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="detail product-detail" aria-labelledby="product-title">
      <Thumb src={product.imageUrl} large />

      <header className="detail-head">
        <div>
          <p className="detail-sub">
            {categoryName} · {mine ? '내가 올린 상품' : `${product.sellerNickname} 님의 상품`}
          </p>
          <h2 id="product-title">{product.title}</h2>
        </div>
        <p className="detail-price">{won(product.price)}</p>
      </header>

      <div className="detail-status">
        <span className={`pill pill-${PRODUCT_TONE[product.status]}`}>{PRODUCT_STATUS[product.status]}</span>
      </div>

      {product.description && <p className="product-description">{product.description}</p>}

      <div className="actions">
        {links.trade && (
          <div className="action">
            <button type="button" className="btn btn-primary" onClick={startChat} disabled={busy}>
              {busy ? '채팅방 여는 중…' : '판매자와 채팅하기'}
            </button>
            <p className="action-hint">
              대화로 거래 장소와 시간을 정해요. 판매자가 송금 요청을 보내면 카카오페이로 송금해요.
            </p>
          </div>
        )}
        {mine && (
          <div className="action">
            <button type="button" className="btn btn-ghost" onClick={() => onShowChats(product.productId)}>
              이 상품의 채팅 보기
            </button>
            <p className="action-hint">채팅한 사람 중 한 명에게 채팅방에서 송금 요청을 보낼 수 있어요.</p>
          </div>
        )}
        {!links.trade && !mine && product.status !== 'ON_SALE' && (
          <p className="actions-wait">
            {product.status === 'SOLD' ? '판매가 끝난 상품이에요.' : '다른 구매자와 거래가 진행 중이라 지금은 채팅을 시작할 수 없어요.'}
          </p>
        )}
      </div>

      <ErrorNote error={actionError} />
    </section>
  );
}
