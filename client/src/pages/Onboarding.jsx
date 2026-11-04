import { useNavigate } from 'react-router-dom';
import { setFlag } from '../lib/storage';

// Decorations traced from the Figma export (390 × 844 frame coordinates).
// Each zigzag is four copies of one polyline, 17.33px apart.
const ZIG_LEFT = '-16.4,135 2.6,117.5 19.1,135 41.1,114.4 57,130.3 79,111.6 97,128.6 118.2,110';
const ZIG_RIGHT = '268,463.4 286.9,446.3 303.1,462.1 325.1,441.3 341.1,457.2 363.1,438.7 381.1,457.2 405,435.4';

function Zigzag({ points, viewBox, className }) {
  return (
    <svg aria-hidden viewBox={viewBox} className={className}>
      {[0, 1, 2, 3].map((i) => (
        <polyline key={i} points={points} transform={`translate(0 ${i * 17.33})`} fill="none" stroke="currentColor" strokeWidth="6.3" />
      ))}
    </svg>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();

  const start = () => {
    setFlag('onboarded');
    navigate('/', { replace: true });
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-white md:my-8 md:min-h-[calc(100dvh-4rem)] md:overflow-hidden md:rounded-2xl md:shadow-xl">
      {/* 552px tall on an 844px screen, leaving 292px for the text and button */}
      <div className="relative shrink-0 overflow-hidden bg-brand text-brand-deco" style={{ height: 'min(65.4dvh, calc(100dvh - 292px))', minHeight: 240 }}>
        <svg aria-hidden viewBox="320 0 70 42" className="absolute top-0 right-0 h-[42px] w-[70px]">
          <circle cx="364" cy="-2" r="34.5" fill="none" stroke="currentColor" strokeWidth="19" />
        </svg>
        <Zigzag points={ZIG_LEFT} viewBox="0 106 121 84" className="absolute top-[106px] left-0 h-[84px] w-[121px]" />
        <Zigzag points={ZIG_RIGHT} viewBox="265 434 125 84" className="absolute right-0 bottom-[34px] h-[84px] w-[125px]" />
      </div>

      <div className="flex flex-1 flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <h1 className="mt-[25px] text-2xl leading-8 font-semibold text-black">Manage What To Do</h1>
        <p className="mt-[18px] max-w-[290px] text-xs leading-[18px] text-label">
          The best way to manage what you have to do, don&apos;t forget your plans
        </p>
        <button type="button" onClick={start} className="mt-auto h-12 w-full bg-brand text-base font-medium text-white transition hover:bg-brand/90">
          Get Started
        </button>
      </div>
    </main>
  );
}
