/** 실패 안내. 서버가 준 문장(detail/message)을 그대로 보여 주고, 무엇을 하면 되는지 덧붙인다. */
const NEXT_STEP = {
  NETWORK_ERROR: '서버를 실행했는지, 주소(.env)가 맞는지 확인해 주세요.',
  UPSTREAM_UNAVAILABLE: 'Trade 서버가 Market·Payment·Chat 서버를 부르지 못했어요. 그 서버가 켜져 있는지 확인해 주세요. Payment가 아직 없다면 Trade를 stub-pay 프로필로 실행하세요.',
  USER_NOT_FOUND: '회원 번호를 다시 확인하거나 닉네임으로 새로 가입해 주세요.',
  PRODUCT_NOT_FOUND: '삭제되었거나 없는 상품이에요. 목록을 새로고침해 주세요.',
  SELF_PURCHASE: '내가 올린 상품에는 문의할 수 없어요.',
  DUPLICATE_NICKNAME: '다른 닉네임으로 가입하거나, 회원 번호로 계속해 주세요.',
  PRODUCT_NOT_AVAILABLE: '이 상품은 지금 다른 사람과 거래 중이거나 이미 팔렸어요.',
  INVALID_STATUS: '그사이 거래 상태가 바뀌었어요. 화면을 새로고침해 주세요.',
};

export default function ErrorNote({ error }) {
  if (!error) return null;
  const next = NEXT_STEP[error.code];
  return (
    <div className="error-note" role="alert">
      <p className="error-message">{error.message}</p>
      {error.fieldErrors?.length > 0 && (
        <ul>
          {error.fieldErrors.map((f) => (
            <li key={f.field}>{f.message}</li>
          ))}
        </ul>
      )}
      {next && <p className="error-next">{next}</p>}
      {error.code && <p className="error-code">{error.code}</p>}
    </div>
  );
}
