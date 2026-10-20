import { useCallback, useEffect, useState } from 'react';
import { listCategories } from './api/market.js';
import { getTrade, listTrades } from './api/trade.js';
import ChatPanel from './components/ChatPanel.jsx';
import ErrorNote from './components/ErrorNote.jsx';
import MemberGate from './components/MemberGate.jsx';
import ProductBrowser from './components/ProductBrowser.jsx';
import ProductDetail from './components/ProductDetail.jsx';
import ProductForm from './components/ProductForm.jsx';
import TradeDetail from './components/TradeDetail.jsx';
import TradeList from './components/TradeList.jsx';
import { clearMember, loadMember, saveMember } from './session.js';

const VIEWS = [
  { id: 'products', label: '상품 둘러보기' },
  { id: 'trades', label: '내 거래' },
  { id: 'sell', label: '상품 올리기' },
];

const TABS = [
  { role: 'BUYER', label: '내가 사는 거래' },
  { role: 'SELLER', label: '내가 파는 거래' },
];

// 상대방이 버튼을 누르면 내 화면도 바뀌어야 해서, 끝나지 않은 거래는 5초마다 다시 읽는다
const POLL_MS = 5000;

export default function App() {
  const [member, setMember] = useState(loadMember);
  const [view, setView] = useState('products');
  const [categories, setCategories] = useState([]);

  // 상품
  const [productId, setProductId] = useState(null);
  const [productsReload, setProductsReload] = useState(0);

  // 거래
  const [role, setRole] = useState('BUYER');
  const [productFilter, setProductFilter] = useState(null);
  const [trades, setTrades] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [tradeId, setTradeId] = useState(null);
  const [trade, setTrade] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const memberId = member?.userId;

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const refreshList = useCallback(async () => {
    if (!memberId || view !== 'trades') return;
    setListLoading(true);
    try {
      setTrades(await listTrades(memberId, { role, productId: productFilter }));
      setListError(null);
    } catch (e) {
      setListError(e);
    } finally {
      setListLoading(false);
    }
  }, [memberId, role, productFilter, view]);

  const refreshDetail = useCallback(async () => {
    if (!memberId || !tradeId) return;
    setDetailLoading(true);
    try {
      setTrade(await getTrade(memberId, tradeId));
      setDetailError(null);
    } catch (e) {
      setDetailError(e);
    } finally {
      setDetailLoading(false);
    }
  }, [memberId, tradeId]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  // 좁은 화면에서는 상세가 목록 아래에 있어서, 고르면 상세로 내려 준다
  useEffect(() => {
    if (!productId && !tradeId) return;
    if (!window.matchMedia?.('(max-width: 860px)').matches) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector('.detail-column')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [productId, tradeId]);

  useEffect(() => {
    refreshDetail();
  }, [refreshDetail]);

  useEffect(() => {
    if (view !== 'trades' || !trade || trade.status === 'COMPLETED' || trade.status === 'CANCELED') return undefined;
    const timer = setInterval(() => {
      refreshDetail();
      refreshList();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [view, trade, refreshDetail, refreshList]);

  function enter(next) {
    saveMember(next);
    setMember(next);
    setView('products');
  }

  function leave() {
    clearMember();
    setMember(null);
    setTrades([]);
    setTradeId(null);
    setTrade(null);
    setProductId(null);
  }

  function openTrades(nextRole, filter = null) {
    setView('trades');
    setRole(nextRole);
    setProductFilter(filter);
    setTradeId(null);
    setTrade(null);
  }

  function openTrade(opened) {
    setView('trades');
    setRole(opened.myRole === 'SELLER' ? 'SELLER' : 'BUYER');
    setProductFilter(null);
    setTradeId(opened.tradeId);
    setTrade(opened);
  }

  function handleTradeChanged(updated) {
    setTrade(updated);
    setProductsReload((n) => n + 1); // 송금 요청·구매 확정이면 상품 상태도 바뀐다
    refreshList();
  }

  function handleProductCreated(product) {
    setProductsReload((n) => n + 1);
    setProductId(product.productId);
    setView('products');
  }

  if (!member) {
    return <MemberGate onEnter={enter} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <p className="wordmark">WON-pick</p>
        <nav className="views" aria-label="화면">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`view-link${view === v.id ? ' is-active' : ''}`}
              aria-current={view === v.id ? 'page' : undefined}
              onClick={() => (v.id === 'trades' ? openTrades(role) : setView(v.id))}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <div className="me">
          <span>
            {member.nickname ? `${member.nickname} · ` : ''}회원 {member.userId}번
          </span>
          <button type="button" className="btn-link" onClick={leave}>
            다른 회원으로 바꾸기
          </button>
        </div>
      </header>

      {view === 'products' && (
        <div className="workspace">
          <aside className="sidebar">
            <ProductBrowser
              userId={memberId}
              categories={categories}
              selectedId={productId}
              onOpen={setProductId}
              reloadKey={productsReload}
            />
          </aside>
          <div className="detail-column">
            <ProductDetail
              key={`${productId}-${productsReload}`}
              userId={memberId}
              productId={productId}
              categories={categories}
              onTradeOpened={openTrade}
              onShowInquiries={(id) => openTrades('SELLER', id)}
            />
          </div>
        </div>
      )}

      {view === 'trades' && (
        <div className="workspace">
          <aside className="sidebar">
            <div className="tabs" role="tablist" aria-label="거래 구분">
              {TABS.map((tab) => (
                <button
                  key={tab.role}
                  type="button"
                  role="tab"
                  aria-selected={role === tab.role}
                  className={`tab${role === tab.role ? ' is-active' : ''}`}
                  onClick={() => openTrades(tab.role)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {productFilter && (
              <p className="filter-note">
                상품 {productFilter}번의 문의만 보는 중
                <button type="button" className="btn-link" onClick={() => setProductFilter(null)}>
                  모두 보기
                </button>
              </p>
            )}

            <ErrorNote error={listError} />
            <TradeList role={role} trades={trades} selectedId={tradeId} onSelect={setTradeId} loading={listLoading} />
          </aside>

          <div className="detail-column">
            <ErrorNote error={detailError} />
            <TradeDetail
              memberId={memberId}
              trade={trade && trade.tradeId === tradeId ? trade : null}
              onChanged={handleTradeChanged}
              onRefresh={refreshDetail}
              refreshing={detailLoading}
            />
            {trade && trade.tradeId === tradeId && <ChatPanel trade={trade} />}
          </div>
        </div>
      )}

      {view === 'sell' && (
        <div className="workspace workspace-single">
          <ProductForm userId={memberId} categories={categories} onCreated={handleProductCreated} />
        </div>
      )}
    </div>
  );
}
