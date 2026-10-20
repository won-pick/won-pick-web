// 로그인 기능이 없는 실습이라, 지금 쓰는 회원(userId·닉네임)만 브라우저에 기억해 둔다.
const KEY = 'won-pick.member';

export function loadMember() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveMember(member) {
  try {
    localStorage.setItem(KEY, JSON.stringify(member));
  } catch {
    // 저장이 막힌 브라우저에서도 화면은 동작한다 (새로고침하면 다시 선택)
  }
}

export function clearMember() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}
