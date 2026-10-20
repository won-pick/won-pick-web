import { useEffect, useState } from 'react';
import { listProducts } from '../api/market.js';
import { PRODUCT_STATUS, PRODUCT_TONE, won } from '../tradeText.js';
import ErrorNote from './ErrorNote.jsx';

/** 상품 둘러보기 — Market GET /products (최신순, 상품명 검색, 카테고리) */
export default function ProductBrowser({ userId, categories, selectedId, onOpen, reloadKey }) {
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listProducts(userId, { keyword: query, category, page })
      .then((result) => {
        if (!alive) return;
        setData(result);
        setError(null);
      })
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId, query, category, page, reloadKey]);

  const items = data?.items ?? [];

  return (
    <div className="browser">
      <form
        className="search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setQuery(keyword.trim());
        }}
      >
        <label htmlFor="keyword" className="sr-only">
          상품명 검색
        </label>
        <input
          id="keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="상품명으로 검색"
          maxLength={100}
        />
        <button type="submit" className="btn btn-ghost">
          검색
        </button>
      </form>

      <div className="chips" role="group" aria-label="카테고리">
        {[{ code: '', name: '전체' }, ...categories].map((c) => (
          <button
            key={c.code || 'all'}
            type="button"
            className={`chip${category === c.code ? ' is-active' : ''}`}
            aria-pressed={category === c.code}
            onClick={() => {
              setPage(0);
              setCategory(c.code);
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <ErrorNote error={error} />

      {loading && items.length === 0 && <p className="list-empty">상품을 불러오는 중이에요.</p>}
      {!loading && !error && items.length === 0 && (
        <p className="list-empty">
          {query || category ? '조건에 맞는 상품이 없어요.' : '아직 올라온 상품이 없어요. 첫 상품을 올려 보세요.'}
        </p>
      )}

      <ul className="product-list">
        {items.map((p) => (
          <li key={p.productId}>
            <button
              type="button"
              className={`product-row${p.productId === selectedId ? ' is-selected' : ''}`}
              aria-current={p.productId === selectedId ? 'true' : undefined}
              onClick={() => onOpen(p.productId)}
            >
              <Thumb src={p.imageUrl} />
              <span className="product-row-body">
                <span className="product-row-title">{p.title}</span>
                <span className="product-row-sub">{p.sellerNickname}</span>
                <span className="product-row-meta">
                  <span className="price">{won(p.price)}</span>
                  {p.status !== 'ON_SALE' && (
                    <span className={`pill pill-${PRODUCT_TONE[p.status]}`}>{PRODUCT_STATUS[p.status]}</span>
                  )}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {data && data.totalPages > 1 && (
        <nav className="pager" aria-label="상품 목록 페이지">
          <button type="button" className="btn btn-ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>
            이전
          </button>
          <span>
            {page + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={page + 1 >= data.totalPages}
            onClick={() => setPage(page + 1)}
          >
            다음
          </button>
        </nav>
      )}
    </div>
  );
}

export function Thumb({ src, large = false }) {
  const [broken, setBroken] = useState(false);
  const cls = `thumb${large ? ' thumb-large' : ''}`;
  if (!src || broken) {
    return (
      <span className={`${cls} thumb-empty`} aria-hidden="true">
        사진 없음
      </span>
    );
  }
  return <img className={cls} src={src} alt="" loading="lazy" onError={() => setBroken(true)} />;
}
