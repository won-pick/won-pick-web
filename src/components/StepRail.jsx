import { STEPS } from '../tradeText.js';

/**
 * 거래 장부의 도장 줄. 지나온 단계에는 도장이 찍히고, 지금 단계는 비어 있는 테두리로 기다린다.
 * 취소된 거래는 멈춘 지점 뒤로 줄이 끊긴다.
 */
export default function StepRail({ status }) {
  const canceled = status === 'CANCELED';
  const reached = canceled ? -1 : STEPS.findIndex((s) => s.status === status);

  return (
    <ol className={`rail${canceled ? ' rail-void' : ''}`} aria-label="거래 단계">
      {STEPS.map((step, index) => {
        const state = index <= reached ? 'stamped' : index === reached + 1 && !canceled ? 'next' : 'later';
        return (
          <li key={step.status} className={`rail-step rail-${state}`}>
            <span className="stamp" aria-hidden="true">
              {state === 'stamped' ? '✓' : index + 1}
            </span>
            <span className="rail-label">{step.label}</span>
            <span className="sr-only">
              {state === 'stamped' ? '완료' : state === 'next' ? '다음 단계' : '대기'}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
