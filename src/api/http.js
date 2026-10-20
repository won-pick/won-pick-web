/**
 * 서버 호출 공통 함수.
 * 실패 응답은 두 모양을 모두 읽는다.
 *  - Trade: ProblemDetail { title, detail, code, errors? }
 *  - Market: { code, message }
 */
export class ApiError extends Error {
  constructor(status, code, message, fieldErrors = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function request(url, { method = 'GET', body, memberId, userId, idempotencyKey } = {}) {
  const headers = { Accept: 'application/json, application/hal+json, application/problem+json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (memberId != null) headers['X-Member-Id'] = String(memberId); // Trade 서버
  if (userId != null) headers['X-User-Id'] = String(userId);       // Market 서버
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없습니다. 서버가 켜져 있는지 확인해 주세요.');
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const code = data?.code ?? `HTTP_${response.status}`;
    const message = data?.detail ?? data?.message ?? `요청을 처리하지 못했습니다. (HTTP ${response.status})`;
    throw new ApiError(response.status, code, message, data?.errors ?? []);
  }
  return { status: response.status, data };
}
