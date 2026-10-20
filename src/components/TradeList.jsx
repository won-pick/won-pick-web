import { STATUS_LABEL, STATUS_TONE, won } from '../tradeText.js';

/**
 * 내 거래 목록.
 *  - 구매: 거래 한 줄씩
 *  - 판매: 상품별로 묶어서 "누가 문의했나"를 보여 준다 (한 상품에 여러 명이 문의할 수 있다)
 */
export default function TradeList({ role, trades, selectedId, onSelect, loading }) {
  if (loading && trades.length === 0) {
    return <p className="list-empty">거래를 불러오는 중이에요.</p>;
  }
  if (trades.length === 0) {
    return (
      <p className="list-empty">
        {role === 'BUYER'
          ? '아직 문의한 상품이 없어요. 상품 둘러보기에서 마음에 드는 상품에 문의해 보세요.'
          : '아직 내 상품에 들어온 문의가 없어요.'}
      </p>
    );
  }

  if (role === 'BUYER') {
    return (
      <ul className="trade-list">
        {trades.map((t) => (
          <li key={t.tradeId}>
            <TradeRow trade={t} title={t.productTitle} selected={t.tradeId === selectedId} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    );
  }

  const groups = new Map();
  for (const t of trades) {
    if (!groups.has(t.productId)) groups.set(t.productId, []);
    groups.get(t.productId).push(t);
  }

  return (
    <div className="product-groups">
      {[...groups.entries()].map(([productId, items]) => (
        <section key={productId} className="product-group" aria-label={items[0].productTitle}>
          <header>
            <h3>{items[0].productTitle}</h3>
            <p>
              {won(items[0].price)} · 문의 {items.length}명
            </p>
          </header>
          <ul className="trade-list">
            {items.map((t) => (
              <li key={t.tradeId}>
                <TradeRow
                  trade={t}
                  title={`구매자 ${t.buyerId}번`}
                  selected={t.tradeId === selectedId}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TradeRow({ trade, title, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`trade-row${selected ? ' is-selected' : ''}`}
      aria-current={selected ? 'true' : undefined}
      onClick={() => onSelect(trade.tradeId)}
    >
      <span className="trade-row-title">{title}</span>
      <span className="trade-row-meta">
        <span className={`pill pill-${STATUS_TONE[trade.status]}`}>{STATUS_LABEL[trade.status]}</span>
        <span className="price">{won(trade.price)}</span>
      </span>
    </button>
  );
}
