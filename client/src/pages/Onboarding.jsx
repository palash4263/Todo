import { useNavigate } from 'react-router-dom';
import { setFlag } from '../lib/storage';

function Zigzag({ className }) {
  return (
    <svg aria-hidden viewBox="0 0 90 60" fill="none" className={className}>
      {[0, 1, 2, 3, 4].map((row) => (
        <polyline
          key={row}
          points={Array.from({ length: 7 }, (_, i) => `${i * 15},${row * 12 + (i % 2 ? 0 : 8)}`).join(' ')}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="miter"
        />
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
      <div className="relative h-[58dvh] min-h-72 shrink-0 overflow-hidden bg-brand md:h-[52dvh]">
        <span aria-hidden className="absolute -top-8 -right-8 size-24 rounded-full border-[14px] border-white/25" />
        <Zigzag className="absolute top-[30%] left-0 w-24 text-white/30" />
        <Zigzag className="absolute right-0 bottom-[8%] w-24 text-white/30" />
      </div>

      <div className="flex flex-1 flex-col px-5 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <h1 className="text-[22px] font-semibold underline decoration-brand decoration-[3px] underline-offset-[6px]">Manage What To Do</h1>
        <p className="mt-5 max-w-[19rem] text-xs leading-relaxed text-ink/70">
          The best way to manage what you have to do, don&apos;t forget your plans
        </p>
        <button type="button" onClick={start} className="mt-auto h-11 w-full rounded-[3px] bg-brand text-sm font-medium text-white transition hover:bg-brand/90">
          Get Started
        </button>
      </div>
    </main>
  );
}
