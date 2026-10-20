import { useState } from 'react';
import { createProduct } from '../api/market.js';
import ErrorNote from './ErrorNote.jsx';

/** 상품 올리기 — Market POST /products. 사진은 이미지 주소(선택)로 받는다. */
export default function ProductForm({ userId, categories, onCreated }) {
  const [form, setForm] = useState({ title: '', price: '', category: '', description: '', imageUrl: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const product = await createProduct(userId, {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
      });
      onCreated(product);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="detail sell" aria-labelledby="sell-title">
      <h2 id="sell-title">상품 올리기</h2>
      <p className="detail-sub">같은 반 사람들에게 바로 보여요. 판매 중일 때만 수정·삭제할 수 있어요.</p>

      <form className="sell-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">상품명</label>
          <input id="title" value={form.title} onChange={set('title')} maxLength={100} required placeholder="예: 스프링 부트 교재" />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="price">가격 (원)</label>
            <input
              id="price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, '') })}
              inputMode="numeric"
              required
              placeholder="예: 15000"
            />
          </div>
          <div className="field">
            <label htmlFor="category">카테고리</label>
            <select id="category" value={form.category} onChange={set('category')} required>
              <option value="" disabled>
                골라 주세요
              </option>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="description">설명 (선택)</label>
          <textarea
            id="description"
            value={form.description}
            onChange={set('description')}
            maxLength={5000}
            rows={4}
            placeholder="상태, 거래 장소(예: 3층 강의실 앞) 등을 적어 주세요."
          />
        </div>

        <div className="field">
          <label htmlFor="imageUrl">사진 주소 (선택)</label>
          <input
            id="imageUrl"
            value={form.imageUrl}
            onChange={set('imageUrl')}
            maxLength={500}
            inputMode="url"
            placeholder="https://… 로 시작하는 이미지 주소"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? '올리는 중…' : '상품 올리기'}
        </button>
      </form>

      <ErrorNote error={error} />
    </section>
  );
}
