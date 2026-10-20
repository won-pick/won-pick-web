import { useState } from 'react';
import { getUser, signUp } from '../api/market.js';
import ErrorNote from './ErrorNote.jsx';

/**
 * 시작 화면. 로그인 API가 없는 실습이라 두 가지로 들어온다.
 *  - 처음이면 닉네임으로 가입 (Market POST /users)
 *  - 이미 가입했으면 회원 번호로 계속
 */
export default function MemberGate({ onEnter }) {
  const [nickname, setNickname] = useState('');
  const [userId, setUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSignUp(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await signUp(nickname.trim());
      onEnter({ userId: user.userId, nickname: user.nickname });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleContinue(event) {
    event.preventDefault();
    const id = Number(userId);
    if (!Number.isInteger(id) || id < 1) {
      setError({ message: '회원 번호는 1 이상의 숫자로 입력해 주세요.' });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const user = await getUser(id);
      if (user.status !== 'ACTIVE') {
        setError({ message: '탈퇴한 회원 번호예요. 다른 번호로 계속하거나 새로 가입해 주세요.' });
        return;
      }
      onEnter({ userId: user.userId, nickname: user.nickname });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="gate">
      <div className="gate-brand">
        <p className="wordmark">WON-pick</p>
        <h1 className="gate-title">
          우리 반에서 쓰던 물건,
          <br />
          우리 반에서 다시.
        </h1>
        <p className="gate-lead">
          우리WON 청년 IT 아카데미 A·B반 수강생과 강사, 매니저가 함께 쓰는 중고거래예요. 돈은 카카오페이로 판매자에게 바로 보내고,
          거래 단계는 WON-pick이 기록해요.
        </p>
      </div>

      <div className="gate-forms">
        <form className="gate-card" onSubmit={handleSignUp}>
          <h2>처음 왔어요</h2>
          <label htmlFor="nickname">닉네임</label>
          <input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
            placeholder="예: 스프링새싹"
            autoComplete="nickname"
            required
          />
          <button type="submit" className="btn btn-primary" disabled={busy || !nickname.trim()}>
            {busy ? '가입하는 중…' : '닉네임으로 가입하기'}
          </button>
        </form>

        <form className="gate-card gate-card-quiet" onSubmit={handleContinue}>
          <h2>이미 가입했어요</h2>
          <label htmlFor="userId">회원 번호</label>
          <input
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            inputMode="numeric"
            placeholder="예: 3"
            required
          />
          <button type="submit" className="btn btn-ghost" disabled={busy || !userId}>
            이 번호로 계속하기
          </button>
        </form>

        <ErrorNote error={error} />
      </div>
    </main>
  );
}
