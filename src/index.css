@import "tailwindcss";

@theme {
  --font-pixel: "Press Start 2P", monospace;
  --font-retro: "VT323", monospace;
}

html, body {
  background: #070a1a;
  overscroll-behavior: none;
}

.font-pixel { font-family: var(--font-pixel); }
.font-retro { font-family: var(--font-retro); }

.pixelated {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* CRT scanline overlay */
.crt::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.12) 3px,
    rgba(0, 0, 0, 0.12) 4px
  );
  mix-blend-mode: multiply;
  z-index: 30;
  border-radius: inherit;
}

.crt::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%);
  z-index: 31;
  border-radius: inherit;
}

.pixel-border {
  box-shadow:
    0 -4px 0 0 rgba(0,0,0,0.35) inset,
    0 4px 0 0 rgba(255,255,255,0.25) inset,
    -4px 0 0 0 rgba(0,0,0,0.2) inset,
    4px 0 0 0 rgba(255,255,255,0.15) inset;
}

.pixel-btn {
  position: relative;
  transition: transform 0.06s ease, filter 0.15s ease;
  box-shadow: 0 4px 0 rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.25);
}
.pixel-btn:hover { filter: brightness(1.12); transform: translateY(-1px); }
.pixel-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.2); }

.pixel-panel {
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.12), inset 0 -3px 0 rgba(0,0,0,0.4), 0 10px 40px rgba(0,0,0,0.5);
  border: 4px solid #000;
}

@keyframes floaty {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes blink-hard {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes coin-spin {
  0%, 100% { transform: scaleX(1); }
  50% { transform: scaleX(0.25); }
}
@keyframes bounce-soft {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.animate-floaty { animation: floaty 3s ease-in-out infinite; }
.animate-blink-hard { animation: blink-hard 1s step-end infinite; }
.animate-marquee { animation: marquee 22s linear infinite; }
.animate-coin-spin { animation: coin-spin 1.2s ease-in-out infinite; }
.animate-bounce-soft { animation: bounce-soft 1.6s ease-in-out infinite; }

.text-stroke {
  -webkit-text-stroke: 2px #000;
  paint-order: stroke fill;
  text-shadow: 4px 4px 0 #000;
}
.text-stroke-sm {
  -webkit-text-stroke: 1px #000;
  paint-order: stroke fill;
  text-shadow: 2px 2px 0 #000;
}

canvas { -webkit-tap-highlight-color: transparent; }

/* custom scrollbar */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: #0b1026; }
::-webkit-scrollbar-thumb { background: #3b82f6; border: 2px solid #0b1026; border-radius: 6px; }
