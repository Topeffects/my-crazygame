import { useEffect, useState } from "react";
import {
  Play, ShoppingBag, Info, Volume2, VolumeX, Coins, ArrowLeft, Lock,
  Timer, Flame, Trophy, Check, Zap, Heart, Skull, Sparkles, Map, Crown, X,
  Star, ChevronRight, Gamepad2,
} from "lucide-react";
import GameCanvas from "./components/GameCanvas";
import SkinSprite from "./components/SkinSprite";
import { SKINS, getSkin } from "./game/skins";
import { THEMES, LEVEL_NAMES, LEVEL_TIMES, LEVEL_DIFF } from "./game/levels";
import { audio } from "./game/audio";

type Screen = "menu" | "levels" | "shop" | "game";

const MAX_LEVEL = 8;
const GIMMICKS = ["CLASSIC", "SLIPPERY ICE", "DARK CLIMB", "DEEP CAVES", "LAVA PITS", "DUNE SEAS", "SKY BRIDGES", "HAUNTED", "FINAL CORE"];

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

function click() {
  audio.unlock();
  audio.select();
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [levelIndex, setLevelIndex] = useState(0);
  const [coins, setCoins] = useState(() => load<number>("spp_coins", 0));
  const [owned, setOwned] = useState<string[]>(() => load<string[]>("spp_owned", ["classic"]));
  const [selected, setSelected] = useState(() => load<string>("spp_selected", "classic"));
  const [unlocked, setUnlocked] = useState(() => load<number>("spp_unlocked", 0));
  const [best, setBest] = useState<Record<number, number>>(() => load("spp_best", {}));
  const [sound, setSound] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => save("spp_coins", coins), [coins]);
  useEffect(() => save("spp_owned", owned), [owned]);
  useEffect(() => save("spp_selected", selected), [selected]);
  useEffect(() => save("spp_unlocked", unlocked), [unlocked]);
  useEffect(() => save("spp_best", best), [best]);

  useEffect(() => {
    audio.setEnabled(sound);
  }, [sound]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  const addCoins = (n: number) => setCoins((c) => c + n);

  const completeLevel = (idx: number, score: number) => {
    setBest((b) => ({ ...b, [idx]: Math.max(b[idx] ?? 0, score) }));
    setUnlocked((u) => Math.max(u, Math.min(MAX_LEVEL, idx + 1)));
  };

  const playLevel = (i: number) => {
    click();
    setLevelIndex(Math.max(0, Math.min(MAX_LEVEL, i)));
    setScreen("game");
  };

  const buySkin = (id: string, cost: number) => {
    if (owned.includes(id)) {
      setSelected(id);
      click();
      return;
    }
    if (coins < cost) {
      flash(`Need ${cost - coins} more coins!`);
      return;
    }
    setCoins((c) => c - cost);
    setOwned((o) => [...o, id]);
    setSelected(id);
    audio.unlock();
    audio.powerup();
    flash("New skin unlocked!");
  };

  const skin = getSkin(selected);

  if (screen === "game") {
    return (
      <GameCanvas
        levelIndex={levelIndex}
        skin={skin}
        sound={sound}
        bankCoins={coins}
        onToggleSound={() => setSound((s) => !s)}
        addCoins={addCoins}
        completeLevel={completeLevel}
        goMenu={() => { click(); setScreen("menu"); }}
        goShop={() => { click(); setScreen("shop"); }}
        goLevels={() => { click(); setScreen("levels"); }}
        playLevel={playLevel}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070a1a] text-white">
      <Backdrop />

      {/* top toast */}
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
          <div className="font-pixel animate-bounce-soft rounded border-2 border-yellow-300 bg-black/90 px-4 py-2 text-[10px] text-yellow-300">
            {toast}
          </div>
        </div>
      )}

      {screen === "menu" && (
        <MenuScreen
          coins={coins}
          unlocked={unlocked}
          skin={skin}
          sound={sound}
          onToggleSound={() => { setSound((s) => !s); }}
          onPlay={() => playLevel(Math.min(unlocked, MAX_LEVEL))}
          onLevels={() => { click(); setScreen("levels"); }}
          onShop={() => { click(); setScreen("shop"); }}
          onHelp={() => { click(); setShowHelp(true); }}
        />
      )}

      {screen === "levels" && (
        <LevelsScreen
          coins={coins}
          unlocked={unlocked}
          best={best}
          onBack={() => { click(); setScreen("menu"); }}
          onPlay={playLevel}
        />
      )}

      {screen === "shop" && (
        <ShopScreen
          coins={coins}
          owned={owned}
          selected={selected}
          onBack={() => { click(); setScreen("menu"); }}
          onBuy={buySkin}
          onPlay={() => playLevel(Math.min(unlocked, MAX_LEVEL))}
        />
      )}

      {showHelp && <HelpModal onClose={() => { click(); setShowHelp(false); }} />}
    </div>
  );
}

/* ---------------- BACKDROP ---------------- */
function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1035] via-[#1c2a5e] to-[#3b4a8f]" />
      {/* stars */}
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${(i * 37.7) % 100}%`,
            top: `${(i * 23.3) % 55}%`,
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            opacity: 0.3 + ((i * 13) % 60) / 100,
          }}
        />
      ))}
      {/* moon */}
      <div className="absolute right-[12%] top-[10%] h-20 w-20 rounded-full bg-[#f4f1de] shadow-[0_0_60px_rgba(244,241,222,0.4)]" />
      <div className="absolute right-[13.5%] top-[9%] h-16 w-16 rounded-full bg-[#1c2a5e]" />
      {/* clouds */}
      <div className="absolute left-[5%] top-[16%] animate-floaty opacity-80">
        <Cloud w={120} />
      </div>
      <div className="absolute left-[55%] top-[8%] animate-floaty opacity-60" style={{ animationDelay: "-1.2s" }}>
        <Cloud w={170} />
      </div>
      <div className="absolute left-[80%] top-[30%] animate-floaty opacity-70" style={{ animationDelay: "-2s" }}>
        <Cloud w={90} />
      </div>
      {/* hills */}
      <svg className="absolute bottom-16 left-0 h-40 w-full" preserveAspectRatio="none" viewBox="0 0 1200 160">
        <path d="M0,160 L0,120 Q150,20 300,110 Q420,30 600,100 Q780,10 950,105 Q1080,40 1200,110 L1200,160 Z" fill="#16351f" />
      </svg>
      <svg className="absolute bottom-16 left-0 h-28 w-full" preserveAspectRatio="none" viewBox="0 0 1200 160">
        <path d="M0,160 L0,130 Q200,60 400,125 Q600,40 800,120 Q1000,60 1200,120 L1200,160 Z" fill="#1f5c3d" />
      </svg>
      {/* ground */}
      <div className="absolute bottom-0 h-16 w-full border-t-4 border-black bg-[#b25a1e]">
        <div className="h-3 w-full bg-[#3fd44f]" />
        <div
          className="h-full w-full opacity-30"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 30px, rgba(0,0,0,.5) 30px 33px)" }}
        />
      </div>
      {/* floating coins */}
      <div className="absolute left-[15%] top-[45%] animate-coin-spin text-3xl">🪙</div>
      <div className="absolute left-[70%] top-[55%] animate-coin-spin text-2xl" style={{ animationDelay: "-0.5s" }}>🪙</div>
      <div className="absolute left-[42%] top-[35%] animate-coin-spin text-xl" style={{ animationDelay: "-0.9s" }}>🪙</div>
    </div>
  );
}

function Cloud({ w }: { w: number }) {
  return (
    <svg width={w} height={w * 0.45} viewBox="0 0 120 54">
      <ellipse cx="35" cy="38" rx="24" ry="14" fill="#fff" />
      <ellipse cx="62" cy="30" rx="26" ry="18" fill="#fff" />
      <ellipse cx="90" cy="38" rx="20" ry="13" fill="#fff" />
    </svg>
  );
}

/* ---------------- MENU ---------------- */
function MenuScreen(props: {
  coins: number; unlocked: number; skin: ReturnType<typeof getSkin>; sound: boolean;
  onToggleSound: () => void; onPlay: () => void; onLevels: () => void; onShop: () => void; onHelp: () => void;
}) {
  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-10">
      {/* coin bank + sound */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <div className="pixel-panel font-pixel flex items-center gap-2 rounded bg-[#101736] px-3 py-2 text-xs text-yellow-300">
          <Coins size={14} /> {props.coins}
        </div>
        <button onClick={props.onToggleSound} className="pixel-btn rounded bg-slate-700 p-2.5 text-white">
          {props.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      <div className="font-pixel animate-bounce-soft rounded border-2 border-red-500 bg-black/60 px-3 py-1.5 text-[10px] tracking-widest text-red-400">
        ★ PLUMBER 2 • NEW UPDATE ★
      </div>
      <div className="pointer-events-none absolute left-[6%] top-[24%] hidden animate-floaty md:block">
        <div className="font-pixel flex h-12 w-12 items-center justify-center rounded border-4 border-black bg-[#f7b500] text-xl text-[#7a4a00] shadow-[0_0_25px_rgba(247,181,0,0.6)]">?</div>
      </div>
      <div className="pointer-events-none absolute right-[6%] top-[32%] hidden animate-floaty md:block" style={{ animationDelay: "-1.5s" }}>
        <div className="font-pixel flex h-12 w-12 items-center justify-center rounded border-4 border-black bg-[#e8792e] text-xl text-[#8f3d00] shadow-[0_0_25px_rgba(232,121,46,0.5)]">?</div>
      </div>
      <h1 className="mt-3 text-center">
        <span className="font-pixel block text-sm tracking-[0.4em] text-yellow-300 sm:text-base">THE SEQUEL IS HERE</span>
        <span className="font-pixel text-stroke block text-4xl leading-tight text-white sm:text-6xl md:text-7xl">
          PLUMBER<span className="text-red-500">2</span>
        </span>
      </h1>
      <p className="font-retro mt-2 text-center text-2xl text-cyan-200">
        Run • Jump • Stomp • <span className="text-yellow-300">Get Rich!</span>
      </p>
      <p className="font-pixel mt-1 text-center text-[9px] text-purple-300 sm:text-[10px]">
        9 WORLDS • 12 HERO SKINS • WILD ABILITIES
      </p>

      {/* rage warning banner */}
      <div className="font-pixel mt-4 flex items-center gap-2 rounded border-2 border-orange-500 bg-black/60 px-3 py-2 text-[9px] text-orange-300 sm:text-[10px]">
        <Flame size={14} className="text-orange-400" />
        WARNING: ENEMIES RAGE AS TIME PASSES — KEEP MOVING!
      </div>

      <div className="mt-6 flex flex-col items-center gap-6 md:flex-row md:gap-10">
        {/* hero preview */}
        <div className="pixel-panel flex flex-col items-center rounded-lg bg-[#101736]/90 p-5">
          <div className="animate-floaty">
            <SkinSprite skin={props.skin} size={84} />
          </div>
          <div className="font-pixel mt-2 text-[10px] text-white">{props.skin.name}</div>
          <div className="font-retro text-lg leading-tight text-slate-400">{props.skin.tagline}</div>
          <div className="font-pixel mt-2 inline-flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-[8px] text-white">
            <Zap size={10} /> {props.skin.ability.name}
          </div>
          <div className="font-retro text-center text-base leading-tight text-purple-200">{props.skin.ability.desc}</div>
          <button onClick={props.onShop} className="pixel-btn font-pixel mt-3 flex items-center gap-2 rounded bg-yellow-500 px-3 py-2 text-[9px] text-black">
            <ShoppingBag size={12} /> CHANGE SKIN
          </button>
        </div>

        {/* buttons */}
        <div className="flex w-64 flex-col gap-3">
          <button onClick={props.onPlay} className="pixel-btn font-pixel group flex items-center justify-between rounded-lg bg-green-500 px-5 py-4 text-xs text-white">
            <span className="flex items-center gap-2"><Play size={16} className="fill-white" /> PLAY</span>
            <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
          <button onClick={props.onLevels} className="pixel-btn font-pixel group flex items-center justify-between rounded-lg bg-blue-500 px-5 py-4 text-xs text-white">
            <span className="flex items-center gap-2"><Map size={16} /> LEVELS</span>
            <span className="rounded bg-black/40 px-2 py-0.5 text-[9px]">{props.unlocked + 1}/9</span>
          </button>
          <button onClick={props.onShop} className="pixel-btn font-pixel group flex items-center justify-between rounded-lg bg-yellow-500 px-5 py-4 text-xs text-black">
            <span className="flex items-center gap-2"><ShoppingBag size={16} /> SKIN SHOP</span>
            <span className="flex items-center gap-1 rounded bg-black/30 px-2 py-0.5 text-[9px]"><Coins size={10} />{props.coins}</span>
          </button>
          <button onClick={props.onHelp} className="pixel-btn font-pixel group flex items-center justify-between rounded-lg bg-purple-500 px-5 py-4 text-xs text-white">
            <span className="flex items-center gap-2"><Info size={16} /> HOW TO PLAY</span>
            <Gamepad2 size={16} />
          </button>
        </div>
      </div>

      <div className="font-pixel animate-blink-hard mt-8 text-[10px] text-slate-400">— PRESS PLAY TO START —</div>
      <div className="font-retro mt-2 text-center text-lg text-slate-500">
        A love letter to classic 8-bit platformers • Best on desktop + sound on
      </div>
    </div>
  );
}

/* ---------------- LEVELS ---------------- */
function LevelsScreen(props: {
  coins: number; unlocked: number; best: Record<number, number>;
  onBack: () => void; onPlay: (i: number) => void;
}) {
  const allBeaten = props.unlocked >= MAX_LEVEL && (props.best[MAX_LEVEL] ?? 0) > 0;
  return (
    <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <button onClick={props.onBack} className="pixel-btn font-pixel flex items-center gap-2 rounded bg-slate-700 px-3 py-2.5 text-[10px] text-white">
          <ArrowLeft size={14} /> MENU
        </button>
        <h2 className="font-pixel text-stroke text-lg text-white sm:text-2xl">SELECT WORLD</h2>
        <div className="pixel-panel font-pixel flex items-center gap-2 rounded bg-[#101736] px-3 py-2 text-xs text-yellow-300">
          <Coins size={14} /> {props.coins}
        </div>
      </div>

      {allBeaten && (
        <div className="font-pixel mt-4 flex items-center justify-center gap-2 rounded border-2 border-yellow-300 bg-yellow-500/20 px-3 py-2 text-center text-[10px] text-yellow-300">
          <Crown size={14} /> CHAMPION! YOU CONQUERED ALL 9 WORLDS! <Crown size={14} />
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LEVEL_NAMES.map((lv, i) => {
          const locked = i > props.unlocked;
          const th = THEMES[i];
          return (
            <button
              key={i}
              disabled={locked}
              onClick={() => props.onPlay(i)}
              className={`pixel-panel group relative overflow-hidden rounded-lg text-left transition-transform ${locked ? "cursor-not-allowed opacity-70" : "hover:-translate-y-1"}`}
            >
              {/* theme preview */}
              <div
                className="relative h-28 p-3"
                style={{ background: `linear-gradient(180deg, ${th.skyDayTop}, ${th.skyDayMid} 60%, ${th.skyDayBot})` }}
              >
                <div className="absolute bottom-0 left-0 h-6 w-full" style={{ background: th.groundBase }}>
                  <div className="h-1.5 w-full" style={{ background: th.grass }} />
                </div>
                <svg className="absolute bottom-5 left-4 h-12 w-32" viewBox="0 0 120 60">
                  <path d="M0,60 Q30,5 60,55 Q90,10 120,55 Z" fill={th.hillNear} />
                </svg>
                <div className="font-pixel absolute left-3 top-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white">
                  {lv.sub}
                </div>
                {locked ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Lock size={30} className="text-slate-400" />
                  </div>
                ) : (
                  <div className="absolute bottom-8 right-3 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, f) => (
                      <Flame key={f} size={12} className={f <= Math.min(i, 4) ? "fill-orange-500 text-orange-400" : "text-white/30"} />
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-[#101736] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-pixel text-xs text-white">{lv.name}</div>
                  <div className="font-pixel shrink-0 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[8px] text-cyan-200">
                    {GIMMICKS[i]}
                  </div>
                </div>
                <div className="font-retro text-lg leading-tight text-slate-400">{th.label}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="font-pixel flex items-center gap-1 text-[9px] text-orange-300">
                    <Timer size={11} /> {LEVEL_TIMES[i]}s
                  </div>
                  <div className="font-pixel text-[9px] text-red-300">×{LEVEL_DIFF[i].toFixed(2)} RAGE</div>
                  <div className="font-pixel flex items-center gap-1 text-[9px] text-yellow-300">
                    <Trophy size={11} /> {props.best[i] ?? 0}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {/* coming soon card */}
        <div className="pixel-panel flex min-h-[200px] flex-col items-center justify-center rounded-lg bg-[#101736]/60 p-6 text-center opacity-60">
          <Skull size={28} className="text-slate-500" />
          <div className="font-pixel mt-2 text-[10px] text-slate-400">WORLD 2-10</div>
          <div className="font-retro text-xl text-slate-500">Coming soon...</div>
        </div>
      </div>

      <div className="font-retro mt-5 text-center text-xl text-slate-400">
        9 worlds of platforming — desert dunes, sky bridges, haunted hollows and the molten core await!
      </div>
    </div>
  );
}

/* ---------------- SHOP ---------------- */
function ShopScreen(props: {
  coins: number; owned: string[]; selected: string;
  onBack: () => void; onBuy: (id: string, cost: number) => void; onPlay: () => void;
}) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <button onClick={props.onBack} className="pixel-btn font-pixel flex items-center gap-2 rounded bg-slate-700 px-3 py-2.5 text-[10px] text-white">
          <ArrowLeft size={14} /> MENU
        </button>
        <h2 className="font-pixel text-stroke text-lg text-white sm:text-2xl">SKIN SHOP</h2>
        <div className="pixel-panel font-pixel flex items-center gap-2 rounded bg-[#101736] px-3 py-2 text-xs text-yellow-300">
          <Coins size={14} /> {props.coins}
        </div>
      </div>

      <p className="font-retro mt-3 text-center text-xl text-slate-300">
        Grab coins in levels to unlock fresh plumber drip. Every skin has its own ability!
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SKINS.map((s) => {
          const isOwned = props.owned.includes(s.id);
          const isSelected = props.selected === s.id;
          const afford = props.coins >= s.cost;
          return (
            <div
              key={s.id}
              className={`pixel-panel relative rounded-lg bg-[#101736] p-4 text-center ${isSelected ? "outline outline-4 outline-green-400" : ""}`}
            >
              {s.isNew && (
                <div className="font-pixel absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-red-500 px-2 py-0.5 text-[8px] text-white">
                  ★ NEW ★
                </div>
              )}
              <div
                className="flex justify-center rounded border-2 border-black py-3"
                style={{ background: "repeating-conic-gradient(#1a2145 0 25%, #141a38 0 50%) 0 0/24px 24px" }}
              >
                <div className={isSelected ? "animate-floaty" : ""}>
                  <SkinSprite skin={s} size={56} fire={s.id === "inferno"} />
                </div>
              </div>
              <div className="font-pixel mt-3 text-[11px] text-white">{s.name}</div>
              <div className="font-retro text-lg leading-tight text-slate-400">{s.tagline}</div>
              <div className="mt-2 rounded border border-purple-500/50 bg-purple-900/30 px-2 py-1.5">
                <div className="font-pixel flex items-center justify-center gap-1 text-[8px] text-purple-200">
                  <Zap size={10} /> {s.ability.name}
                </div>
                <div className="font-retro text-base leading-tight text-purple-100/80">{s.ability.desc}</div>
              </div>
              <div className="mt-3">
                {isSelected ? (
                  <div className="font-pixel flex items-center justify-center gap-1 rounded bg-green-600 px-3 py-2.5 text-[10px] text-white">
                    <Check size={12} /> EQUIPPED
                  </div>
                ) : isOwned ? (
                  <button onClick={() => props.onBuy(s.id, s.cost)} className="pixel-btn font-pixel w-full rounded bg-blue-500 px-3 py-2.5 text-[10px] text-white">
                    SELECT
                  </button>
                ) : (
                  <button
                    onClick={() => props.onBuy(s.id, s.cost)}
                    className={`pixel-btn font-pixel flex w-full items-center justify-center gap-1.5 rounded px-3 py-2.5 text-[10px] ${afford ? "bg-yellow-500 text-black" : "bg-slate-700 text-slate-400"}`}
                  >
                    <Coins size={12} /> {s.cost} COINS
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center">
        <button onClick={props.onPlay} className="pixel-btn font-pixel flex items-center gap-2 rounded-lg bg-green-500 px-6 py-4 text-xs text-white">
          <Play size={16} /> EARN MORE COINS — PLAY!
        </button>
      </div>
    </div>
  );
}

/* ---------------- HELP ---------------- */
function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3" onClick={onClose}>
      <div
        className="pixel-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-[#101736] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-pixel text-sm text-white sm:text-base">HOW TO PLAY</h3>
          <button onClick={onClose} className="pixel-btn rounded bg-slate-700 p-2 text-white"><X size={14} /></button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded border-2 border-black bg-black/40 p-3">
            <div className="font-pixel text-[10px] text-cyan-300">⌨ CONTROLS</div>
            <ul className="font-retro mt-2 space-y-1 text-xl leading-tight text-slate-200">
              <li>← → / A D — move</li>
              <li>SPACE / W / Z — jump (hold = higher)</li>
              <li>SHIFT / X — run (hold) + fire</li>
              <li>P / ESC — pause</li>
              <li className="text-slate-400">Mobile: on-screen A / B pad</li>
              <li className="text-purple-300">Your skin SKILL is always on!</li>
              <li className="text-cyan-300">World 2-2 ice is slippery — brake early!</li>
            </ul>
          </div>
          <div className="rounded border-2 border-black bg-black/40 p-3">
            <div className="font-pixel flex items-center gap-1 text-[10px] text-orange-300"><Flame size={12} /> TIME = RAGE</div>
            <ul className="font-retro mt-2 space-y-1 text-xl leading-tight text-slate-200">
              <li>Every second, enemies get <span className="text-red-400">faster</span>.</li>
              <li>After 60s, <span className="text-red-400">RAGE SURGES</span> spawn extra baddies ahead.</li>
              <li>The sky darkens &amp; music speeds up.</li>
              <li>Grab the flag fast for a <span className="text-yellow-300">time bonus</span>!</li>
            </ul>
          </div>
          <div className="rounded border-2 border-black bg-black/40 p-3">
            <div className="font-pixel text-[10px] text-green-300">🍄 POWER-UPS</div>
            <ul className="font-retro mt-2 space-y-1 text-xl leading-tight text-slate-200">
              <li><span className="text-red-400">●</span> Mushroom — grow SUPER, smash bricks</li>
              <li><span className="text-orange-400">●</span> Fire Flower — shoot with RUN</li>
              <li><span className="text-yellow-300">●</span> Star — 9s of invincible rainbow</li>
              <li><span className="text-green-400">●</span> 1-UP — extra life (max 5)</li>
            </ul>
          </div>
          <div className="rounded border-2 border-black bg-black/40 p-3">
            <div className="font-pixel text-[10px] text-red-300">👾 BADDIES</div>
            <ul className="font-retro mt-2 space-y-1 text-xl leading-tight text-slate-200">
              <li><span className="text-amber-500">●</span> Chomper — stomp it!</li>
              <li><span className="text-green-400">●</span> Shelly — stomp, then kick the shell</li>
              <li><span className="text-red-500">●</span> Spiky — DON'T stomp! Use shells/fire</li>
              <li className="text-slate-400">Wood planks: jump up through them!</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded border-2 border-purple-500 bg-purple-500/10 p-3">
          <div className="font-pixel flex items-center gap-1 text-[10px] text-purple-200"><Zap size={12} /> SKIN ABILITIES (NEW IN PLUMBER 2!)</div>
          <div className="font-retro mt-2 grid grid-cols-1 gap-x-4 gap-y-0.5 text-lg leading-tight text-slate-200 sm:grid-cols-2">
            {SKINS.map((s) => (
              <div key={s.id} className="flex gap-1.5">
                <span className="text-purple-300">⚡</span>
                <span><span className="text-white">{s.name}:</span> <span className="text-slate-300">{s.ability.name} — {s.ability.desc}</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded border-2 border-yellow-500 bg-yellow-500/10 p-3">
          <div className="font-pixel flex items-center gap-1 text-[10px] text-yellow-300"><Sparkles size={12} /> PRO TIPS</div>
          <ul className="font-retro mt-1 space-y-0.5 text-xl leading-tight text-slate-200">
            <li>• Bump ? blocks from below. Chained stomps = up to 1600 pts!</li>
            <li>• Shells kill everything — even Spikies. Kicked shells bounce off walls.</li>
            <li>• Coins persist even if you die — farm them for the 750-coin GALAXY skin.</li>
            <li>• Reach the glowing checkpoint to respawn mid-level.</li>
          </ul>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3 text-center">
          <span className="font-pixel flex items-center gap-1 text-[9px] text-pink-300"><Heart size={12} /> 3 lives (4 w/ Lucky!)</span>
          <span className="font-pixel flex items-center gap-1 text-[9px] text-cyan-300"><Zap size={12} /> Run-jump clears wide pits</span>
          <span className="font-pixel flex items-center gap-1 text-[9px] text-yellow-300"><Star size={12} /> Flag height = bonus</span>
        </div>
      </div>
    </div>
  );
}
