import type { Skin } from "../game/skins";

export default function SkinSprite({ skin, size = 64, fire = false }: { skin: Skin; size?: number; fire?: boolean }) {
  const c = skin.colors;
  const shirt = fire ? "#ffffff" : c.shirt;
  const hat = fire ? "#ffffff" : c.hat;
  const hatDark = fire ? "#e52521" : c.hatDark;
  const overalls = fire ? "#e52521" : c.overalls;
  return (
    <svg
      width={size}
      height={size * 1.28}
      viewBox="0 0 24 31"
      shapeRendering="crispEdges"
      className="pixelated"
      style={skin.glow ? { filter: `drop-shadow(0 0 6px ${skin.glow})` } : undefined}
    >
      {/* shoes */}
      <rect x="1" y="25" width="10" height="6" fill="#0a0a0a" />
      <rect x="13" y="25" width="10" height="6" fill="#0a0a0a" />
      <rect x="2" y="26" width="8" height="4" fill={c.shoes} />
      <rect x="14" y="26" width="8" height="4" fill={c.shoes} />
      {/* legs */}
      <rect x="3" y="20" width="7" height="6" fill={overalls} />
      <rect x="14" y="20" width="7" height="6" fill={overalls} />
      {/* body */}
      <rect x="2" y="11" width="20" height="10" fill="#0a0a0a" />
      <rect x="3" y="12" width="18" height="8" fill={shirt} />
      <rect x="6" y="12" width="5" height="8" fill={overalls} />
      <rect x="13" y="12" width="5" height="8" fill={overalls} />
      <rect x="6" y="15" width="2" height="2" fill="#ffd700" />
      <rect x="16" y="15" width="2" height="2" fill="#ffd700" />
      {/* arms */}
      <rect x="0" y="13" width="4" height="8" fill="#0a0a0a" />
      <rect x="20" y="13" width="4" height="8" fill="#0a0a0a" />
      <rect x="0" y="16" width="4" height="5" fill={c.glove} />
      <rect x="20" y="16" width="4" height="5" fill={c.glove} />
      {/* head */}
      <rect x="4" y="3" width="17" height="9" fill="#0a0a0a" />
      <rect x="5" y="4" width="15" height="7" fill={c.skin} />
      <rect x="20" y="6" width="3" height="4" fill={c.skin} />
      <rect x="13" y="5" width="3" height="4" fill="#0a0a0a" />
      {/* hat */}
      <rect x="2" y="0" width="21" height="4" fill="#0a0a0a" />
      <rect x="3" y="0" width="19" height="3" fill={hat} />
      <rect x="10" y="0" width="5" height="3" fill="#ffffff" />
      <rect x="11" y="0" width="3" height="2" fill={hatDark} />
    </svg>
  );
}
