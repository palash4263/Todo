// Dev-only: lays a Figma export (client/design/*.png, 390×844 @2x) over the page to compare pixel by pixel.
// Open the app in a 390px-wide window with ?overlay=home | onboarding | new-task | search
//   O = show/hide   [ ] = opacity   D = difference mode (matching pixels turn black)
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const DESIGNS = {
  onboarding: new URL('../../design/onboarding.png', import.meta.url).href,
  home: new URL('../../design/home.png', import.meta.url).href,
  'new-task': new URL('../../design/new-task.png', import.meta.url).href,
  search: new URL('../../design/search.png', import.meta.url).href,
};

function Overlay({ name }) {
  const [visible, setVisible] = useState(true);
  const [opacity, setOpacity] = useState(0.5);
  const [difference, setDifference] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      if (e.key === 'o') setVisible((v) => !v);
      if (e.key === '[') setOpacity((o) => Math.max(0, +(o - 0.1).toFixed(1)));
      if (e.key === ']') setOpacity((o) => Math.min(1, +(o + 0.1).toFixed(1)));
      if (e.key === 'd') setDifference((d) => !d);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!visible) return null;
  return (
    <>
      <img
        src={DESIGNS[name]}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 390,
          zIndex: 9999,
          pointerEvents: 'none',
          opacity: difference ? 1 : opacity,
          mixBlendMode: difference ? 'difference' : 'normal',
        }}
      />
      <div style={{ position: 'fixed', right: 4, top: 4, zIndex: 10000, font: '11px monospace', background: '#000c', color: '#fff', padding: '2px 6px', pointerEvents: 'none' }}>
        {name} {difference ? 'diff' : `${Math.round(opacity * 100)}%`} · O [ ] D
      </div>
    </>
  );
}

export function mount() {
  const name = new URLSearchParams(window.location.search).get('overlay');
  if (!DESIGNS[name]) return;
  const el = document.createElement('div');
  document.body.appendChild(el);
  createRoot(el).render(<Overlay name={name} />);
}
