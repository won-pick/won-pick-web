import { useEffect, useRef, useState } from 'react';
import { getProduct } from '../api/market.js';
import { createTrade, newIdempotencyKey } from '../api/trade.js';
import { PRODUCT_STATUS, PRODUCT_TONE, won } from '../tradeText.js';
import ErrorNote from './ErrorNote.jsx';
import { Thumb } from './ProductBrowser.jsx';

/**
 * 상품 상세 — Market GET /products/{id}.
 * "구매 문의하기"는 Market이 _links.trade 를 줄 때만 보인다 (판매 중이고, 내 상품이 아닐 때).
 * 그 링크(Trade의 POST /trades)를 그대로 따라간다.
 */
export default function ProductDetail({ userId, productId, categories, onTradeOpened, onShowInquiries }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const keyRef = useRef(null);

  useEffect(() => {
    if (!productId) return undefined;
    let alive = true;
    setLoading(true);
    setActionError(null);
    keyRef.current = null;
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

  async function inquire() {
    if (!keyRef.current) keyRef.current = newIdempotencyKey();
    setBusy(true);
    setActionError(null);
    try {
      const { trade } = await createTrade(userId, product.productId, keyRef.current, links.trade.href);
      keyRef.current = null;
      onTradeOpened(trade);
    } catch (e) {
      if (e.status !== 0) keyRef.current = null; // 연결 실패만 같은 키로 다시 시도
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
            <button type="button" className="btn btn-primary" onClick={inquire} disabled={busy}>
              {busy ? '문의하는 중…' : '구매 문의하기'}
            </button>
            <p className="action-hint">
              판매자와 거래가 시작돼요. 송금은 판매자가 송금 요청을 보낸 뒤에 카카오페이로 해요.
            </p>
          </div>
        )}
        {mine && (
          <div className="action">
            <button type="button" className="btn btn-ghost" onClick={() => onShowInquiries(product.productId)}>
              이 상품의 문의 보기
            </button>
            <p className="action-hint">문의한 사람 중 한 명을 골라 송금 요청을 보낼 수 있어요.</p>
          </div>
        )}
        {!links.trade && !mine && product.status !== 'ON_SALE' && (
          <p className="actions-wait">
            {product.status === 'SOLD' ? '판매가 끝난 상품이에요.' : '다른 구매자와 거래가 진행 중이라 지금은 문의할 수 없어요.'}
          </p>
        )}
      </div>

      <ErrorNote error={actionError} />
    </section>
  );
}
