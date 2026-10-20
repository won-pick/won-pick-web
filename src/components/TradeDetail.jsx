import { useState } from 'react';
import { followLink } from '../api/trade.js';
import { ACTIONS, ACTION_ORDER, STATUS_LABEL, STATUS_TONE, dateTime, won } from '../tradeText.js';
import ErrorNote from './ErrorNote.jsx';
import StepRail from './StepRail.jsx';

const RESOURCE_LINKS = [
  { rel: 'product', label: 'Market 상품' },
  { rel: 'chat', label: 'Chat 채팅방' },
  { rel: 'payment', label: 'Payment 결제' },
];

/**
 * 거래 상세. 버튼은 응답의 _links 에 있는 것만 그린다 (HATEOAS).
 * 이 화면은 "누가 무엇을 할 수 있나"를 판단하지 않는다 — 서버가 링크로 알려 준다.
 */
export default function TradeDetail({ memberId, trade, onChanged, onRefresh, refreshing, compact = false }) {
  const [busyRel, setBusyRel] = useState(null);
  const [error, setError] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  if (!trade) {
    return (
      <section className="detail detail-empty">
        <p>왼쪽에서 거래를 고르면 여기에 거래 장부가 열려요.</p>
      </section>
    );
  }

  const links = trade._links ?? {};
  const actions = ACTION_ORDER.filter((rel) => links[rel]);
  const isBuyer = trade.myRole === 'BUYER';

  async function run(rel, body) {
    setBusyRel(rel);
    setError(null);
    try {
      const updated = await followLink(memberId, links[rel], body);
      setCancelOpen(false);
      setReason('');
      onChanged(updated, rel);
    } catch (e) {
      setError(e);
    } finally {
      setBusyRel(null);
    }
  }

  function handleAction(rel) {
    if (rel === 'transfer') {
      window.open(links.transfer.href, '_blank', 'noopener,noreferrer');
      return;
    }
    if (rel === 'cancel') {
      setCancelOpen((open) => !open);
      return;
    }
    run(rel);
  }

  return (
    <section className={`detail${compact ? ' detail-compact' : ''}`} aria-labelledby="detail-title">
      <header className={`detail-head${compact ? ' sr-only' : ''}`}>
        <div>
          <p className="detail-sub">
            거래 {trade.tradeId}번 · {isBuyer ? `판매자 ${trade.sellerId}번과의 거래` : `구매자 ${trade.buyerId}번과의 거래`}
          </p>
          <h2 id="detail-title">{trade.productTitle}</h2>
        </div>
        <p className="detail-price">{won(trade.price)}</p>
      </header>

      <div className="detail-status">
        <span className={`pill pill-${STATUS_TONE[trade.status]}`}>{STATUS_LABEL[trade.status]}</span>
        <button type="button" className="btn-link" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? '불러오는 중…' : '새로고침'}
        </button>
      </div>

      <StepRail status={trade.status} />

      {trade.status === 'CANCELED' && (
        <p className="void-note">{trade.cancelReason ? `취소 사유: ${trade.cancelReason}` : '사유 없이 취소된 거래예요.'}</p>
      )}

      <div className="actions">
        {waitingText(trade) ? <p className="actions-wait">{waitingText(trade)}</p> : null}
        {actions.map((rel) => {
          const action = ACTIONS[rel];
          const kind = action.danger ? 'btn-danger' : action.primary ? 'btn-primary' : 'btn-ghost';
          return (
            <div key={rel} className="action">
              <button
                type="button"
                className={`btn ${kind}`}
                onClick={() => handleAction(rel)}
                disabled={busyRel !== null}
                aria-expanded={rel === 'cancel' ? cancelOpen : undefined}
              >
                {busyRel === rel ? '처리하는 중…' : action.label}
              </button>
              <p className="action-hint">{action.hint}</p>
            </div>
          );
        })}

        {cancelOpen && links.cancel && (
          <form
            className="cancel-form"
            onSubmit={(e) => {
              e.preventDefault();
              run('cancel', { reason: reason.trim() || null });
            }}
          >
            <label htmlFor="cancel-reason">취소 사유 (선택)</label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="예: 일정이 안 맞아요"
            />
            <div className="cancel-buttons">
              <button type="submit" className="btn btn-danger" disabled={busyRel !== null}>
                {busyRel === 'cancel' ? '취소하는 중…' : '거래 취소하기'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setCancelOpen(false)}>
                그만두기
              </button>
            </div>
          </form>
        )}
      </div>

      <ErrorNote error={error} />

      <footer className="detail-foot">
        <dl className="facts">
          <div>
            <dt>송금 요청한 때</dt>
            <dd>{dateTime(trade.createdAt)}</dd>
          </div>
          <div>
            <dt>마지막 변경</dt>
            <dd>{dateTime(trade.updatedAt)}</dd>
          </div>
        </dl>
        <div className={`resources${compact ? ' sr-only' : ''}`}>
          <p>이 거래와 이어진 다른 서버의 자원</p>
          <ul>
            {RESOURCE_LINKS.filter((r) => links[r.rel]).map((r) => (
              <li key={r.rel}>
                <span>{r.label}</span>
                <code>{links[r.rel].href}</code>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </section>
  );
}

/** 지금 내가 누를 버튼이 없을 때, 누구를 기다리는지 알려 준다 */
function waitingText(trade) {
  const buyer = trade.myRole === 'BUYER';
  switch (trade.status) {
    case 'PAYMENT_REQUESTED':
      return buyer ? '' : '구매자의 송금을 기다리는 중이에요.';
    case 'PAID':
      return buyer ? '' : '구매자가 물건을 받고 구매 확정하면 거래가 끝나요.';
    case 'COMPLETED':
      return '거래가 끝났어요. 수고하셨어요!';
    default:
      return '';
  }
}
