import { STATUS_LABEL, STATUS_TONE, won } from '../tradeText.js';

/**
 * 내 거래 목록.
 *  - 구매: 거래 한 줄씩
 *  - 판매: 상품별로 묶어서 보여 준다 (취소된 뒤 다른 구매자와 다시 거래할 수 있다)
 */
export default function TradeList({ role, trades, selectedId, onSelect, loading }) {
  if (loading && trades.length === 0) {
    return <p className="list-empty">거래를 불러오는 중이에요.</p>;
  }
  if (trades.length === 0) {
    return (
      <p className="list-empty">
        {role === 'BUYER'
          ? '아직 거래가 없어요. 판매자가 채팅에서 송금 요청을 보내면 여기에 생겨요.'
          : '아직 거래가 없어요. 채팅방에서 구매자에게 송금 요청을 보내면 여기에 생겨요.'}
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
              {won(items[0].price)} · 거래 {items.length}건
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
